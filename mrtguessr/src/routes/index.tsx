  // MRTGuessr - Frontend
  // Copyright (C) 2026 Seshan Ravikumar

  // This program is free software: you can redistribute it and/or modify
  // it under the terms of the GNU Affero General Public License as published by
  // the Free Software Foundation, either version 3 of the License, or
  // (at your option) any later version.

  // This program is distributed in the hope that it will be useful,
  // but WITHOUT ANY WARRANTY; without even the implied warranty of
  // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  // GNU Affero General Public License for more details.

  // You should have received a copy of the GNU Affero General Public License
  // along with this program.  If not, see <https://www.gnu.org/licenses/>.
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation } from '@tanstack/react-query'
import { logoUrl, getHealth, startGame, fetchGameStatistics, fetchDynmapNewData, getPlayerFaceUrl, type CustomGameOptions } from '@/lib/api'
import { ConstructionIcon, Dot, ChevronDown } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect } from 'react'
import { MultiSelect } from '@/components/ui/multi-select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useFeatureFlagEnabled } from '@posthog/react'

export const Route = createFileRoute('/')({component: App })

function App() {
  const navigate = useNavigate({
    from: "/"
  });

  const auth = useAuth();

  // -- Feature Flags --
  const mcGuessEnabled = useFeatureFlagEnabled('mc-guess-mode');

  const [showCustomOptions, setShowCustomOptions] = useState(false);
  const [selectedRanks, setSelectedRanks] = useState<string[]>([]);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [useMcGuessMode, setUseMcGuessMode] = useState(false);

  const AVAILABLE_RANKS = [
    'Special', 'Premier', 'Senator', 'Governor',
    'Mayor', 'Councillor', 'Community', 'Unranked'
  ];

  // Load saved preferences from localStorage on mount
  useEffect(() => {
    const savedRanks = localStorage.getItem('customGameOptions.selectedRanks');
    const savedMcGuessMode = localStorage.getItem('customGameOptions.useMcGuessMode');
    const savedPlayer = localStorage.getItem('customGameOptions.selectedPlayer');
    const savedPlayers = localStorage.getItem('customGameOptions.selectedPlayers');

    let hasCustomOptions = false;

    if (savedRanks) {
      try {
        const parsedRanks = JSON.parse(savedRanks);
        setSelectedRanks(parsedRanks);
        if (parsedRanks.length > 0) {
          hasCustomOptions = true;
        }
      } catch (e) {
        console.error('Failed to parse saved ranks', e);
      }
    }

    if (savedMcGuessMode) {
      const mcGuessEnabled = savedMcGuessMode === 'true';
      setUseMcGuessMode(mcGuessEnabled);
      if (mcGuessEnabled) {
        hasCustomOptions = true;
      }
    }

    if (savedPlayer) {
      setSelectedPlayer(savedPlayer);
    }

    if (savedPlayers) {
      try {
        setSelectedPlayers(JSON.parse(savedPlayers));
      } catch (e) {
        console.error('Failed to parse saved players', e);
      }
    }

    // Open the custom options drawer if any custom options are set
    if (hasCustomOptions) {
      setShowCustomOptions(true);
    }
  }, []);

  // Save selectedRanks to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('customGameOptions.selectedRanks', JSON.stringify(selectedRanks));
  }, [selectedRanks]);

  // Save useMcGuessMode to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('customGameOptions.useMcGuessMode', String(useMcGuessMode));
  }, [useMcGuessMode]);

  // Save selectedPlayer to localStorage whenever it changes
  useEffect(() => {
    if (selectedPlayer) {
      localStorage.setItem('customGameOptions.selectedPlayer', selectedPlayer);
    } else {
      localStorage.removeItem('customGameOptions.selectedPlayer');
    }
  }, [selectedPlayer]);

  // Save selectedPlayers to localStorage whenever it changes
  useEffect(() => {
    if (selectedPlayers.length > 0) {
      localStorage.setItem('customGameOptions.selectedPlayers', JSON.stringify(selectedPlayers));
    } else {
      localStorage.removeItem('customGameOptions.selectedPlayers');
    }
  }, [selectedPlayers]);

  // Reset all custom game options to defaults
  const resetCustomOptions = () => {
    setSelectedRanks([]);
    setUseMcGuessMode(false);
    setSelectedPlayer(null);
    setSelectedPlayers([]);
    // Clear from localStorage
    localStorage.removeItem('customGameOptions.selectedRanks');
    localStorage.removeItem('customGameOptions.useMcGuessMode');
    localStorage.removeItem('customGameOptions.selectedPlayer');
    localStorage.removeItem('customGameOptions.selectedPlayers');
  };

  const {data: healthData} = useQuery({
    queryKey: ['health'],
    queryFn: getHealth,
    refetchInterval: 10000,
  });

  const { data: dynmapData } = useQuery({
    queryKey: ['dynmapPlayers'],
    queryFn: fetchDynmapNewData,
    enabled: showPlayerModal,
    refetchInterval: showPlayerModal ? 5000 : false,
  });

  const isMultiplayer = selectedPlayers.length > 1;

  const startGameMutation = useMutation({
    mutationFn: ({ gameType, customOptions }: {
      gameType: 'NORMAL' | 'MC_GUESS',
      customOptions?: CustomGameOptions
    }) => startGame(gameType, customOptions),
    onSuccess: (data) => {
      setShowPlayerModal(false);
      if (useMcGuessMode && selectedPlayers.length > 0) {
        // Mark this tab as the host for this game uuid
        sessionStorage.setItem('mcGuessGameUuid', data.uuid);
        navigate({
          to: `/game/${data.uuid}`,
          search: { players: selectedPlayers.join(',') },
          viewTransition: true,
        });
      } else {
        navigate({ to: `/game/${data.uuid}`, viewTransition: true });
      }
    },
  });

  const { data: gameStatistics } = useQuery({
    queryKey: ['gameStatistics'],
    queryFn: fetchGameStatistics,
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <section className="relative py-20 px-6 text-center">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10"></div>
        <div className="relative max-w-5xl mx-auto">
          <div className="flex items-center justify-center gap-6 mb-6">
            <img
              src={logoUrl.Full}
              alt="MRTGuessr Logo"
              className="w-[50%] h-auto mx-auto"
            />
          </div>
          <p className="text-2xl md:text-3xl text-gray-300 mb-4 font-light">
            Guess cities and locations around the <a href="https://minecartrapidtransit.net" className='underline decoration-dotted'>MinecartRapidTransit Server</a>!
          </p>
          <p className="text-md text-gray-400 max-w-3xl mx-auto mb-8 text-orange-400">
            <ConstructionIcon className="inline-block mr-2 mb-1 animate-pulse" size={20} />
            MRTGuessr is under construction!<ConstructionIcon className="inline-block ml-2 mb-1 animate-pulse" size={20} /><br />
            New locations are being added regularly, and you may encounter bugs.
            
          </p>
          <div className={`flex flex-col items-center gap-4 animate-all duration-500 ${startGameMutation.isPending ? 'opacity-0' : 'opacity-100'}`}>
            {healthData ? (
              <>
                <div
                  onClick={() => {
                    if (useMcGuessMode && selectedPlayers.length === 0) {
                      setShowPlayerModal(true);
                    } else {
                      const customOptions = selectedRanks.length > 0
                        ? { rankFilter: selectedRanks }
                        : undefined;
                      const gameType = useMcGuessMode ? 'MC_GUESS' : 'NORMAL';
                      startGameMutation.mutate({ gameType, customOptions });
                    }
                  }}
                  className="px-8 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-cyan-500/50 select-none cursor-pointer"
                >
                  Play Now!
                </div>

                {/* Custom Game Options */}
                <div className="w-full max-w-md">
                  <button
                    type="button"
                    onClick={() => setShowCustomOptions(!showCustomOptions)}
                    className="text-sm text-gray-400 hover:text-gray-300 transition-colors flex items-center gap-2 mx-auto"
                  >
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-300 ${showCustomOptions ? 'rotate-180' : ''}`}
                    />
                    Custom Game Options
                  </button>

                  <div
                    className={`grid transition-all duration-300 ease-in-out ${
                      showCustomOptions ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    }`}
                  >
                    <div className="min-h-0">
                      <div className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700 space-y-4">
                      <p className="text-sm text-orange-300 block mb-2">Games with custom options won't count toward leaderboards.</p>
                      <hr className="border-slate-700 mb-3" />
                      <div>
                        <label className="text-sm text-white font-semibold block mb-2">
                          City Rank Filter
                        </label>
                        <p className="text-xs text-gray-400 mb-3">
                          Select specific city ranks to practice with.
                        </p>
                        <MultiSelect
                          options={AVAILABLE_RANKS.map(rank => ({ label: rank, value: rank }))}
                          selected={selectedRanks}
                          onChange={setSelectedRanks}
                          placeholder="Select ranks..."
                        />
                      </div>
                      {selectedRanks.length > 0 && (
                        <div className="text-xs text-cyan-400">
                          {selectedRanks.length} rank{selectedRanks.length !== 1 ? 's' : ''} selected
                        </div>
                      )}

                      <hr className="border-slate-700 my-3" />
                      {mcGuessEnabled &&
                        (<div>
                          <label className="text-sm text-white font-semibold block mb-2">
                            Get to X Mode
                          </label>
                          <p className="text-xs text-gray-400 mb-3">
                            Track your real-time position as you navigate to the location in-game.
                          </p>
                          <div className="flex items-center justify-center gap-3">
                            <Switch
                              checked={useMcGuessMode}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  // When enabling, clear any previous player selection and show dialog
                                  setSelectedPlayer(null);
                                  setSelectedPlayers([]);
                                  setUseMcGuessMode(true);
                                  setShowPlayerModal(true);
                                } else {
                                  // When disabling, clear everything
                                  setUseMcGuessMode(false);
                                  setSelectedPlayer(null);
                                  setSelectedPlayers([]);
                                }
                              }}
                            />
                            <span className="text-sm text-gray-300">
                              {useMcGuessMode ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>
                              {useMcGuessMode && selectedPlayers.length > 0 && (
                            <div className="text-xs text-cyan-400 mt-2">
                              {selectedPlayers.length === 1
                                ? `Selected player: ${selectedPlayers[0]}`
                                : `${selectedPlayers.length} players selected — multiplayer mode`}
                            </div>
                          )}
                          {useMcGuessMode && selectedPlayers.length > 1 && !auth.isAuthenticated && (
                            <div className="text-xs text-orange-400 mt-1">
                              You must be logged in to host a multiplayer game.
                            </div>
                          )}
                        </div>)
                      }

                      {/* Reset Button */}
                      {(selectedRanks.length > 0 || useMcGuessMode || selectedPlayer || selectedPlayers.length > 0) && (
                        <>
                          <hr className="border-slate-700 my-3" />
                          <div className="flex justify-center">
                            <Button
                              variant="outline"
                              onClick={resetCustomOptions}
                              className="text-sm bg-slate-800 hover:bg-slate-700 text-gray-300 border-slate-600"
                            >
                              Reset All Options
                            </Button>
                          </div>
                        </>
                      )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <hr className="border-slate-700 my-4" />
                <p className="text-sm text-gray-500" suppressHydrationWarning>
                  {gameStatistics ? (
                    <>
                      <span>{gameStatistics.totalPanoramas.toLocaleString()} panoramas</span>
                      <Dot className="inline-block" />
                      <span>{gameStatistics.uniqueCities.toLocaleString()} unique cities</span>
                    </>
                  ) : (
                    <>Loading game statistics...</>
                  )}
                </p>
                <div className="text-sm text-gray-400 flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping"></span>
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500"></span>
                  </span>
                  <span>API Status: {healthData}</span>
                </div>
              </>
            ) : (
              <div className="text-sm text-gray-400 mt-2 flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75 animate-ping"></span>
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-yellow-500"></span>
                </span>
                <span>Connecting to API...</span>
              </div>
            )}

          </div>
        </div>
      </section>

      <section className="py-16 px-6 max-w-7xl mx-auto">
        <div className="flex justify-center" suppressHydrationWarning>
          <iframe src={`https://discord.com/widget?id=1469167263117480070&theme=dark${auth.user ? `&username=${encodeURIComponent(auth.user.username)}` : ''}`} width={"350"} height={"500"} allowTransparency frameBorder={"0"} sandbox={"allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"}></iframe>
        </div>
      </section>
      

      <div className="py-6 text-center text-sm text-gray-500" suppressHydrationWarning>
        © {new Date().getFullYear()} Seshpenguin & MeloQueen.
      </div>

      {/* Player Selection Modal */}
      <Dialog open={showPlayerModal} onOpenChange={(open) => {
        setShowPlayerModal(open);
        if (!open && selectedPlayers.length === 0) {
          setUseMcGuessMode(false);
        }
      }}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Select Minecraft Players</DialogTitle>
            <DialogDescription className="text-gray-400">
              Choose one or more players from currently online players. Select multiple for multiplayer — each player opens the game link in their browser.
            </DialogDescription>
          </DialogHeader>
          {isMultiplayer && !auth.isAuthenticated && (
            <p className="text-sm text-orange-400 bg-orange-950/30 border border-orange-800 rounded px-3 py-2">
              You must be logged in to host a multiplayer game. Viewers match by their Discord username.
            </p>
          )}
          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {dynmapData?.players && dynmapData.players.length > 0 ? (
              dynmapData.players.map((player) => {
                const isSelected = selectedPlayers.includes(player.name);
                return (
                  <Button
                    key={player.account}
                    variant={isSelected ? "default" : "outline"}
                    className={`w-full justify-start gap-3 ${
                      isSelected
                        ? 'bg-cyan-500 hover:bg-cyan-600 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-600'
                    }`}
                    onClick={() => {
                      setSelectedPlayers(prev =>
                        isSelected ? prev.filter(p => p !== player.name) : [...prev, player.name]
                      );
                    }}
                  >
                    <img
                      src={getPlayerFaceUrl(player.name)}
                      alt={`${player.name}'s face`}
                      className="w-8 h-8 pixelated"
                      style={{ imageRendering: 'pixelated' }}
                    />
                    {player.name}
                    {isSelected && <span className="ml-auto text-xs opacity-80">✓</span>}
                  </Button>
                );
              })
            ) : (
              <p className="text-gray-400 text-center py-4">
                {dynmapData ? 'No players currently online' : 'Loading players...'}
              </p>
            )}
          </div>
          {selectedPlayers.length > 0 && (
            <p className="text-xs text-cyan-400">
              {selectedPlayers.length === 1
                ? `1 player selected`
                : `${selectedPlayers.length} players selected — multiplayer mode`}
            </p>
          )}
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setShowPlayerModal(false);
                if (selectedPlayers.length === 0) {
                  setUseMcGuessMode(false);
                }
              }}
              className="bg-slate-800 hover:bg-slate-700 text-white border-slate-600"
            >
              Cancel
            </Button>
            <Button
              disabled={selectedPlayers.length === 0}
              onClick={() => {
                setShowPlayerModal(false);
              }}
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
