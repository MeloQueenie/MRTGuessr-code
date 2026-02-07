package me.fridtjof.panorama_screenshot;

import net.fabricmc.api.ClientModInitializer;

import net.fabricmc.fabric.api.client.event.lifecycle.v1.ClientTickEvents;
import net.fabricmc.fabric.api.client.keybinding.v1.KeyBindingHelper;
import net.fabricmc.loader.api.FabricLoader;
import net.minecraft.client.MinecraftClient;
import net.minecraft.client.option.KeyBinding;
import net.minecraft.client.util.InputUtil;
import net.minecraft.text.ClickEvent;
import net.minecraft.text.Text;
import net.minecraft.util.Formatting;
import org.lwjgl.glfw.GLFW;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class PanoramaCraft implements ClientModInitializer {
    public static final Logger LOGGER = LoggerFactory.getLogger("panorama_craft");

	private final File GAME_DIR = new File(FabricLoader.getInstance().getGameDir().toString());
	private final File SCREENSHOT_DIR = new File(FabricLoader.getInstance().getGameDir().toString() + "/screenshots/");
	private final String PANORAMA_NAMES = "panorama_0.png – panorama_5.png";
	private Config config;

	@Override
	public void onInitializeClient() {
		// Load configuration
		config = Config.load();

		KeyBinding panoramaKeyBinding = new KeyBinding("key.panorama_screenshot.take", InputUtil.Type.KEYSYM, GLFW.GLFW_KEY_F4, "key.categories.misc");
		KeyBindingHelper.registerKeyBinding(panoramaKeyBinding);


		ClientTickEvents.END_CLIENT_TICK.register(client -> {
			while (panoramaKeyBinding.wasPressed()) {

				// Center player in block (set fractional coordinates to 0.5)
				double currentX = client.player.getX();
				double currentY = client.player.getY();
				double currentZ = client.player.getZ();
				double centeredX = Math.floor(currentX) + 0.5;
				double centeredZ = Math.floor(currentZ) + 0.5;
				client.player.setPosition(centeredX, currentY, centeredZ);

				// Automatically align player to face north before taking panorama
				client.player.setYaw(180.00001f);
				client.player.setPitch(0f);

				client.takePanorama(GAME_DIR);

				Text panoramaTakenText = Text.literal(PANORAMA_NAMES).formatted(Formatting.UNDERLINE).styled((style) -> {
					return style.withClickEvent(new ClickEvent.OpenFile(SCREENSHOT_DIR.getAbsolutePath()));
				});
				client.player.sendMessage(Text.translatable("screenshot.success", new Object[]{panoramaTakenText}), false);
				client.player.sendMessage(Text.literal("Uploading panorama to API... Please wait!").formatted(Formatting.YELLOW), false);
				
				// Get player coordinates
				double playerX = client.player.getX();
				double playerZ = client.player.getZ();

				// Upload to API in a separate thread to not block the game
				new Thread(() -> {
					try {
						// Wait a bit for the files to be written
						Thread.sleep(500);
						String panoramaFile = uploadPanoramaToAPI(playerX, playerZ, client);
						if (panoramaFile != null) {
							Text successText = Text.literal(panoramaFile).formatted(Formatting.UNDERLINE).styled((style) -> {
								return style.withClickEvent(new ClickEvent.OpenFile(config.assetRepoDir + "/mcPhotosphere/pan/" + panoramaFile));
							});
							client.execute(() -> {
								client.player.sendMessage(Text.literal("Done! ").append(successText), false);
							});
						} else {
							client.execute(() -> {
								client.player.sendMessage(Text.literal("Failed to convert panorama").formatted(Formatting.RED), false);
							});
						}
					} catch (Exception e) {
						LOGGER.error("Error uploading panorama", e);
						client.execute(() -> {
							client.player.sendMessage(Text.literal("Error converting panorama: " + e.getMessage()).formatted(Formatting.RED), false);
						});
					}
				}).start();
			}
		});
	}

	private static class TownInfo {
		String name;
		String rank;
		double distance;

		TownInfo(String name, String rank, double distance) {
			this.name = name;
			this.rank = rank;
			this.distance = distance;
		}
	}

	private TownInfo findNearestTown(int playerX, int playerZ) throws IOException {
		Path townlistPath = Paths.get(config.assetRepoDir, "mcPhotosphere", "townlist.csv");

		if (!Files.exists(townlistPath)) {
			LOGGER.error("Townlist file not found: {}", townlistPath);
			return new TownInfo("N/A", "N/A", Double.MAX_VALUE);
		}

		List<String> lines = Files.readAllLines(townlistPath);
		TownInfo nearest = null;
		double minDistance = Double.MAX_VALUE;

		// Skip header line
		for (int i = 1; i < lines.size(); i++) {
			String line = lines.get(i);
			String[] parts = line.split(",");

			if (parts.length >= 4) {
				try {
					String townName = parts[0];
					int townX = Integer.parseInt(parts[1]);
					int townZ = Integer.parseInt(parts[2]);
					String rank = parts[3];

					// Calculate Euclidean distance
					double distance = Math.sqrt(Math.pow(playerX - townX, 2) + Math.pow(playerZ - townZ, 2));

					if (distance < minDistance) {
						minDistance = distance;
						nearest = new TownInfo(townName, rank, distance);
					}
				} catch (NumberFormatException e) {
					LOGGER.error("Failed to parse town coordinates from line: {}", line);
				}
			}
		}

		if (nearest == null) {
			return new TownInfo("N/A", "N/A", Double.MAX_VALUE);
		}
		return nearest;
	}

	private String uploadPanoramaToAPI(double playerX, double playerZ, MinecraftClient client) throws IOException, InterruptedException {
		// Build multipart form data
		String boundary = UUID.randomUUID().toString();
		HttpClient httpClient = HttpClient.newHttpClient();

		List<byte[]> bodyParts = new ArrayList<>();

		// Add all 6 panorama files
		for (int i = 0; i < 6; i++) {
			File panoramaFile = new File(SCREENSHOT_DIR, "panorama_" + i + ".png");
			if (!panoramaFile.exists()) {
				LOGGER.error("Panorama file not found: {}", panoramaFile.getAbsolutePath());
				return null;
			}

			byte[] fileData = Files.readAllBytes(panoramaFile.toPath());
			String fieldName = "face_" + i;
			String fileName = "panorama_" + i + ".png";

			// Create multipart field
			StringBuilder fieldBuilder = new StringBuilder();
			fieldBuilder.append("--").append(boundary).append("\r\n");
			fieldBuilder.append("Content-Disposition: form-data; name=\"").append(fieldName).append("\"; filename=\"").append(fileName).append("\"\r\n");
			fieldBuilder.append("Content-Type: image/png\r\n\r\n");

			bodyParts.add(fieldBuilder.toString().getBytes(StandardCharsets.UTF_8));
			bodyParts.add(fileData);
			bodyParts.add("\r\n".getBytes(StandardCharsets.UTF_8));
		}

		// Add final boundary
		bodyParts.add(("--" + boundary + "--\r\n").getBytes(StandardCharsets.UTF_8));

		// Combine all parts
		int totalLength = bodyParts.stream().mapToInt(arr -> arr.length).sum();
		byte[] body = new byte[totalLength];
		int offset = 0;
		for (byte[] part : bodyParts) {
			System.arraycopy(part, 0, body, offset, part.length);
			offset += part.length;
		}

		// Build and send request
		HttpRequest request = HttpRequest.newBuilder()
				.uri(URI.create(config.apiUrl))
				.header("Content-Type", "multipart/form-data; boundary=" + boundary)
				.POST(HttpRequest.BodyPublishers.ofByteArray(body))
				.build();

		HttpResponse<byte[]> response = httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());

		if (response.statusCode() == 200) {
			// Read CSV to get the next panorama ID
			Path csvPath = Paths.get(config.assetRepoDir, "mcPhotosphere", "pan_locations.csv");
			int nextId = 1; // Default if CSV is empty or doesn't exist

			if (Files.exists(csvPath)) {
				List<String> lines = Files.readAllLines(csvPath);
				// Skip header and find the last line
				if (lines.size() > 1) {
					String lastLine = lines.get(lines.size() - 1);
					String[] parts = lastLine.split(",");
					if (parts.length > 0 && parts[0].startsWith("panorama_")) {
						try {
							int lastId = Integer.parseInt(parts[0].substring("panorama_".length()));
							nextId = lastId + 1;
						} catch (NumberFormatException e) {
							LOGGER.error("Failed to parse panorama ID from: {}", parts[0]);
						}
					}
				}
			}

			// Save the panorama image with incremented ID
			String outputFileName = "panorama_" + nextId + ".png";
			Path panDir = Paths.get(config.assetRepoDir, "mcPhotosphere", "pan");
			Files.createDirectories(panDir);
			Path outputPath = panDir.resolve(outputFileName);
			Files.write(outputPath, response.body(), StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);

			// Append to CSV with block coordinates (truncate the 0.5 center offset)
			int flooredX = (int) playerX;
			int flooredZ = (int) playerZ;

			// Find nearest town
			TownInfo nearestTown = findNearestTown(flooredX, flooredZ);

			String csvLine = String.format("%s,%d,%d,%s,%s,\n", "panorama_" + nextId, flooredX, flooredZ, nearestTown.name, nearestTown.rank);
			Files.writeString(csvPath, csvLine, StandardCharsets.UTF_8, StandardOpenOption.APPEND);

			LOGGER.info("Panorama saved: {} at X={}, Z={} (nearest: {} - {})", outputFileName, flooredX, flooredZ, nearestTown.name, nearestTown.rank);
			client.execute(() -> {
				client.player.sendMessage(Text.literal("Panorama saved: " + outputFileName + " at X=" + flooredX + ", Z=" + flooredZ + " (nearest town: " + nearestTown.name + " - " + nearestTown.rank + ")").formatted(Formatting.GREEN), false);
			});
			return outputFileName;
		} else {
			LOGGER.error("API returned error: {} - {}", response.statusCode(), new String(response.body(), StandardCharsets.UTF_8));
			return null;
		}
	}
}