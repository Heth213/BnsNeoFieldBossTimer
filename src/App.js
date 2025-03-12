import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, HelpCircle, Users, Clock, Plus, X } from 'lucide-react';
import { supabase } from './supabaseClient';

const BOSS_TIMERS = {
  Jiangshi: { 'Boss Dead': 315, 'Mutant Spawning': 135, 'Mutant Dead': 495 },
  Gigantura: { 'Boss Dead': 315, 'Mutant Spawning': 135, 'Mutant Dead': 495 },
  WuFu: { 'Boss Dead': 315, 'Mutant Spawning': 135, 'Mutant Dead': 495 },
  Pinchy: { 'Boss Dead': 315, 'Mutant Spawning': 135, 'Mutant Dead': 495 },
  GoldenDeva: { 'Boss Dead': 315, 'Mutant Spawning': 135, 'Mutant Dead': 495 },
  Bulbari: { 'Boss Dead': 315, 'Mutant Spawning': 135, 'Mutant Dead': 495 },
};

const alertSound = new Audio('/alert.mp3');
const silentSound = new Audio('/silence.mp3');

export default function App() {
  const [selectedBoss, setSelectedBoss] = useState(() => localStorage.getItem('selectedBoss') || 'Jiangshi');
  const TIMER_VALUES = BOSS_TIMERS[selectedBoss];
  const [timers, setTimers] = useState([]);
  const [volume, setVolume] = useState(() => parseFloat(localStorage.getItem('volume')) || 0.5);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(() => JSON.parse(localStorage.getItem('audioEnabled')) || false);
  const [interactionOccurred, setInteractionOccurred] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userCount, setUserCount] = useState(0);
  const [quickAddChannels, setQuickAddChannels] = useState(() => 
    Array.from({ length: 5 }, (_, index) => ({ id: index + 1, value: '' }))
  );
  const channelRef = useRef([]);

  useEffect(() => {
    channelRef.current = Array(5)
      .fill()
      .map((_, i) => channelRef.current[i] || React.createRef());
  }, []);

  const toggleAudio = () => {
    setAudioEnabled((prev) => {
      const newState = !prev;
      if (newState) {
        alertSound.play().catch(() => {});
        alertSound.pause();
        alertSound.currentTime = 0;
      }
      return newState;
    });
  };

  useEffect(() => {
    localStorage.setItem('selectedBoss', selectedBoss);
  }, [selectedBoss]);

  useEffect(() => {
    localStorage.setItem('audioEnabled', JSON.stringify(audioEnabled));
  }, [audioEnabled]);

  useEffect(() => {
    if (!interactionOccurred) {
      const enableSilentAudio = () => {
        silentSound.play().catch(() => {});
        silentSound.pause();
        silentSound.currentTime = 0;
        setInteractionOccurred(true);
      };

      document.addEventListener('mousemove', enableSilentAudio, { once: true });
      document.addEventListener('keydown', enableSilentAudio, { once: true });
      document.addEventListener('touchstart', enableSilentAudio, {
        once: true,
      });

      return () => {
        document.removeEventListener('mousemove', enableSilentAudio);
        document.removeEventListener('keydown', enableSilentAudio);
        document.removeEventListener('touchstart', enableSilentAudio);
      };
    }
  }, [interactionOccurred]);

  useEffect(() => {
    const fetchTimers = async () => {
      let { data, error } = await supabase
        .from('timers')
        .select('*')
        .eq('boss', selectedBoss);
      if (error) {
        console.error('Błąd pobierania timerów:', error);
      } else {
        await supabase.from('timers').delete().lt('end_time', Date.now());

        setTimers(
          data
            .filter((t) => t.end_time > Date.now())
            .map((t) => ({
              id: t.id,
              channel: t.channel,
              type: t.type,
              endTime: t.end_time,
              timeLeft: Math.max(
                0,
                Math.ceil((t.end_time - Date.now()) / 1000)
              ),
            }))
            .sort((a, b) => a.endTime - b.endTime)
        );
      }
    };
    fetchTimers();
  }, [selectedBoss]);

  useEffect(() => {
    const subscription = supabase
      .channel('timers')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'timers' },
        async (payload) => {
          if (payload.new.boss === selectedBoss) {
            setTimers((prev) => {
              const updatedTimers = prev.filter(
                (t) => t.channel !== payload.new.channel
              );
              return [
                ...updatedTimers,
                {
                  id: payload.new.id,
                  channel: payload.new.channel,
                  type: payload.new.type,
                  endTime: payload.new.end_time,
                  timeLeft: Math.max(
                    0,
                    Math.ceil((payload.new.end_time - Date.now()) / 1000)
                  ),
                },
              ].sort((a, b) => a.endTime - b.endTime);
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [selectedBoss]);

  useEffect(() => {
    localStorage.setItem('volume', volume);
    alertSound.volume = volume;
  }, [volume]);

  useEffect(() => {
    const interval = setInterval(async () => {
      setTimers((prev) => {
        let shouldPlay = false;
        const updatedTimers = prev
          .map((t) => {
            const timeLeft = Math.max(
              0,
              Math.ceil((t.endTime - Date.now()) / 1000)
            );
            if (timeLeft <= 25 && timeLeft > 15 && audioEnabled) {
              shouldPlay = true;
            }
            if (timeLeft === 0) {
              return null;
            }
            return { ...t, timeLeft };
          })
          .filter(Boolean)
          .sort((a, b) => a.endTime - b.endTime);

        if (updatedTimers.length > 0) {
          const nextTimer = updatedTimers[0];
          document.title = `${selectedBoss} - ${
            nextTimer.channel
          } - ${Math.floor(nextTimer.timeLeft / 60)}:${String(
            nextTimer.timeLeft % 60
          ).padStart(2, '0')} left`;
        } else {
          document.title = 'Field Boss Timer';
        }

        if (shouldPlay) {
          if (!isPlaying) {
            alertSound.loop = true;
            alertSound.play();
            setIsPlaying(true);
          }
        } else {
          if (isPlaying) {
            alertSound.pause();
            alertSound.currentTime = 0;
            setIsPlaying(false);
          }
        }

        return updatedTimers;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timers, isPlaying, selectedBoss, audioEnabled]);


  const startTimer = async (channel, type) => {
    if (!channel || !type || isProcessing) return;

    setIsProcessing(true);

    const existingTimer = timers.find(
      (t) => t.channel === channel && t.type === type
    );
    if (existingTimer) {
      setIsProcessing(false);
      return;
    }

    const endTime = Date.now() + TIMER_VALUES[type] * 1000;

    await supabase
      .from('timers')
      .delete()
      .or(
        `end_time.lt.${Date.now()},and(boss.eq.${selectedBoss},channel.eq.${channel})`
      );

    const { error } = await supabase.from('timers').insert([
      {
        boss: selectedBoss,
        channel,
        type,
        end_time: endTime,
      },
    ]);

    setIsProcessing(false);

    if (error) {
      console.error('Błąd zapisu do Supabase:', error);
    }
  };

  useEffect(() => {
    const setupActiveUser = async () => {
      // Generate or get existing userId
      const userId = localStorage.getItem('userId') || crypto.randomUUID();
      localStorage.setItem('userId', userId);

      // Clean up old inactive users (older than 3 minutes) and any existing entry for this userId
      await Promise.all([
        supabase
          .from('active_users')
          .delete()
          .lt('created_at', new Date(Date.now() - 3 * 60 * 1000).toISOString()),
        supabase
          .from('active_users')
          .delete()
          .eq('user_id', userId)
      ]);

      // Add current user
      await supabase
        .from('active_users')
        .insert({
          user_id: userId,
          created_at: new Date().toISOString(),
        });

      // Fetch initial count after adding user
      await fetchActiveUserCount();

      // Set up real-time subscription
      const subscription = supabase
        .channel('active_users')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'active_users' },
          () => {
            fetchActiveUserCount();
          }
        )
        .subscribe();

      // Set up periodic heartbeat to update user's timestamp
      const heartbeatInterval = setInterval(async () => {
        await supabase
          .from('active_users')
          .update({ created_at: new Date().toISOString() })
          .eq('user_id', userId);
      }, 30000); // Update every 30 seconds

      // Function to remove user
      const removeUser = async () => {
        try {
          await supabase
            .from('active_users')
            .delete()
            .eq('user_id', userId);
        } catch (error) {
          console.error('Error removing user:', error);
        }
      };


      const handleBeforeUnload = () => {
        removeUser();
        clearInterval(heartbeatInterval);
      };


      // Add event listeners
      window.addEventListener('beforeunload', handleBeforeUnload);
      window.addEventListener('visibilitychange', async () => {
        if (document.visibilityState === 'hidden') {
          removeUser();
        } else if (document.visibilityState === 'visible') {
          // Re-add user when they become active again
          await supabase
            .from('active_users')
            .insert({
              user_id: userId,
              created_at: new Date().toISOString(),
            })
            .select();
          await fetchActiveUserCount();
        }
      });

      // Cleanup function
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        window.removeEventListener('visibilitychange', handleBeforeUnload);
        clearInterval(heartbeatInterval);
        removeUser();
        supabase.removeChannel(subscription);
      };
    };

    setupActiveUser();
  }, []);

  const fetchActiveUserCount = async () => {
    const { count, error } = await supabase
      .from('active_users')
      .select('*', { count: 'exact', head: true });

    if (!error && count !== null) {
      setUserCount(count);
    } else {
      console.error('Error fetching user count:', error);
    }
  };

  const handleQuickAdd = async (type, channelId) => {
    const channel = quickAddChannels.find(ch => ch.id === channelId);
    if (!channel || !channel.value || isNaN(channel.value) || channel.value < 1 || channel.value > 50) {
      return;
    }
    await startTimer(channel.value, type);
  };


  const addNewChannel = () => {
    setQuickAddChannels(prev => [...prev, { 
      id: Math.max(0, ...prev.map(ch => ch.id)) + 1,
      value: '' 
    }]);
  };

  const removeChannel = (idToRemove) => {
    setQuickAddChannels(prev => prev.filter(ch => ch.id !== idToRemove));
  };

  const updateChannelValue = (id, value) => {
    setQuickAddChannels(prev => 
      prev.map(ch => ch.id === id ? { ...ch, value } : ch)
    );
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800/30 to-slate-900 text-white fixed inset-0 w-full">
      <div className="relative min-h-screen">
        {/* Header - Made sticky */}
        <div className="sticky top-0 z-50 bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-900/90 backdrop-blur-sm border-b border-slate-800/50 shadow-lg">
          <div className="container mx-auto px-4 py-4 max-w-7xl">
            <div className="flex flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200">
                  BnS Field Boss Timer
                </h1>
                <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700/50">
                  <Users size={16} />
                  <span className="text-sm text-slate-300" title="Active users">{userCount}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <select
                  className="bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-600 text-sm"
                  value={selectedBoss}
                  onChange={(e) => setSelectedBoss(e.target.value)}
                >
                  {Object.keys(BOSS_TIMERS).map((boss) => (
                    <option key={boss} value={boss} className="bg-slate-900">{boss}</option>
                  ))}
                </select>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={toggleAudio}
                    className="p-2 rounded-full hover:bg-slate-800/50 transition-colors"
                  >
                    {audioEnabled ? (
                      <Volume2 size={18} className="text-emerald-400" />
                    ) : (
                      <VolumeX size={18} className="text-slate-400" />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={(e) => setVolume(e.target.value)}
                    className="w-24"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 pt-24 pb-6 max-w-7xl">
          <h1 className="text-4xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200">
            {selectedBoss}
          </h1>
          <div className="grid grid-cols-5 gap-8">
            {/* Timer Display */}
            <div className="col-span-3">
              <h2 className="text-lg font-semibold text-slate-200 mb-7">Active Timers</h2>
              <div className={`grid gap-2 ${timers.length > 7 ? 'max-h-[calc(100vh-22rem)] overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-sky-500/30 hover:[&::-webkit-scrollbar-thumb]:bg-sky-500/50' : ''}`}>
                {timers.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <Clock size={36} className="mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No active timers</p>
                  </div>
                ) : (
                  timers.map((t, index) => {
                    const adjustedTimeLeft = t.timeLeft - 15;
                    const minutes = Math.floor(adjustedTimeLeft / 60);
                    const seconds = adjustedTimeLeft % 60;
                    
                    return (
                      <div
                        key={index}
                        className={`
                          p-4 rounded-lg flex items-center justify-between gap-4 w-full relative overflow-hidden
                          ${t.timeLeft <= 15 ? 'bg-slate-800/80 border border-emerald-500/30' :
                            t.timeLeft <= 25 ? 'animate-pulse bg-slate-800/80 border border-red-500/30' :
                            t.type === 'Mutant Spawning' ? 'bg-violet-900/50 border-2 border-violet-500/50' :
                            'bg-slate-800/50 border border-slate-700/30'}
                        `}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-20 h-10 rounded-full bg-slate-900/80 flex items-center justify-center border border-slate-700/30 flex-shrink-0">
                            <span className="text-lg font-bold">Ch.{t.channel}</span>
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-medium text-base">{t.type}</h3>
                          </div>
                        </div>
                        <div className="text-xl font-mono font-medium flex-shrink-0">
                          {t.timeLeft <= 15 ? (
                            <span className="text-emerald-400">SPAWNED</span>
                          ) : (
                            <span className={t.timeLeft <= 25 ? 'text-red-400' : 'text-slate-300'}>
                              {minutes}:{String(seconds).padStart(2, '0')}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Quick Add Timer Panels */}
            <div className="col-span-2 flex flex-col gap-2">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-slate-200">Quick Add Timers</h2>
                <button
                  onClick={addNewChannel}
                  className="p-2 hover:bg-slate-800/50 rounded-full text-slate-300 bg-slate-900/95 border border-slate-700/50"
                  title="Add new channel"
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className={`flex flex-col gap-2 ${quickAddChannels.length > 5 ? 'max-h-[calc(100vh-22rem)] overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-sky-500/30 hover:[&::-webkit-scrollbar-thumb]:bg-sky-500/50' : ''}`}>
                {quickAddChannels.map((channel) => (
                  <div key={channel.id} className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 p-2">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between gap-2 bg-slate-900/50 rounded px-2">
                        <input
                          type="text"
                          value={channel.value}
                          onChange={(e) => updateChannelValue(channel.id, e.target.value)}
                          placeholder="Channel"
                          className="w-full bg-transparent py-1.5 text-center focus:outline-none text-base"
                        />
                        {quickAddChannels.length > 1 && (
                          <button
                            onClick={() => removeChannel(channel.id)}
                            className="p-1 hover:bg-slate-700/30 rounded text-slate-300"
                            title="Remove channel"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          onClick={() => handleQuickAdd('Boss Dead', channel.id)}
                          className="px-2 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 rounded text-xs border border-rose-500/20 transition-colors flex items-center justify-center font-medium text-rose-100"
                        >
                          Boss Dead
                        </button>
                        <button
                          onClick={() => handleQuickAdd('Mutant Spawning', channel.id)}
                          className="px-2 py-1.5 bg-violet-500/20 hover:bg-violet-500/30 rounded text-xs border border-violet-500/20 transition-colors flex items-center justify-center font-medium text-violet-100"
                        >
                          Mutant Spawning
                        </button>
                        <button
                          onClick={() => handleQuickAdd('Mutant Dead', channel.id)}
                          className="px-2 py-1.5 bg-sky-500/20 hover:bg-sky-500/30 rounded text-xs border border-sky-500/20 transition-colors flex items-center justify-center font-medium text-sky-100"
                          title="Mutant Dead"
                        >
                          Mutant Dead
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Help Button */}
          <div className="fixed lg:top-4 lg:right-4 hidden lg:block z-[60]">
            <div className="relative group">
              <HelpCircle className="text-slate-400 cursor-help w-6 h-6" />
              <div className="absolute right-0 mt-2 w-80 p-4 text-sm bg-slate-900/95 backdrop-blur-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-slate-700/50">
                <h4 className="font-semibold mb-2 text-slate-200">Timer Types</h4>
                <ul className="space-y-2 text-slate-300 mb-4">
                  <li className="flex items-center gap-2">
                    <span className="w-28 text-rose-100">Boss Dead</span>
                    <span className="text-slate-400">Click when boss is killed</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-28 text-violet-100">Mutant Spawning</span>
                    <span className="text-slate-400">Click when lightning spawns after boss is killed</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-28 text-sky-100">Mutant Dead</span>
                    <span className="text-slate-400">Click when lightning boss is killed</span>
                  </li>
                </ul>
                <h4 className="font-semibold mb-2 text-slate-200">Keyboard Shortcuts</h4>
                <ul className="space-y-2 text-slate-300">
                  <li className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-slate-800 rounded text-xs border border-slate-700/50">+</kbd>
                    <span>Add new channel panel</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
