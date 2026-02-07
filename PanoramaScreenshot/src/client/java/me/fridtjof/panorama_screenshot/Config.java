package me.fridtjof.panorama_screenshot;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import net.fabricmc.loader.api.FabricLoader;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

public class Config {
    private static final Gson GSON = new GsonBuilder().setPrettyPrinting().create();
    private static final Path CONFIG_PATH = FabricLoader.getInstance().getConfigDir().resolve("panorama_screenshot.json");

    private static Config instance;

    // Config values
    public String apiUrl = "https://mrtguessr.seshan.xyz/api/service/panorama_convert";
    public String assetRepoDir = "/home/seshpenguin/Documents/MRTGuessr-code/backend/MRTGuessr-assets";

    public static Config load() {
        if (instance == null) {
            if (Files.exists(CONFIG_PATH)) {
                try {
                    String json = Files.readString(CONFIG_PATH);
                    instance = GSON.fromJson(json, Config.class);
                    PanoramaCraft.LOGGER.info("Loaded config from {}", CONFIG_PATH);
                } catch (IOException e) {
                    PanoramaCraft.LOGGER.error("Failed to load config, using defaults", e);
                    instance = new Config();
                    instance.save();
                }
            } else {
                PanoramaCraft.LOGGER.info("Config file not found, creating default config at {}", CONFIG_PATH);
                instance = new Config();
                instance.save();
            }
        }
        return instance;
    }

    public void save() {
        try {
            Files.createDirectories(CONFIG_PATH.getParent());
            String json = GSON.toJson(this);
            Files.writeString(CONFIG_PATH, json);
            PanoramaCraft.LOGGER.info("Saved config to {}", CONFIG_PATH);
        } catch (IOException e) {
            PanoramaCraft.LOGGER.error("Failed to save config", e);
        }
    }

    public static Config getInstance() {
        if (instance == null) {
            load();
        }
        return instance;
    }
}
