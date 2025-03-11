import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, HelpCircle } from 'lucide-react';
import { supabase } from './supabaseClient';

const BOSS_TIMERS = {
  Jiangshi: { 'Boss Dead': 315, 'Mutant Spawning': 135, 'Mutant Dead': 495 },
  Gigantura: { 'Boss Dead': 315, 'Mutant Spawning': 135, 'Mutant Dead': 495 },
  WuFu: { 'Boss Dead': 315, 'Mutant Spawning': 135, 'Mutant Dead': 495 },
  Pinchy: { 'Boss Dead': 315, 'Mutant Spawning': 135, 'Mutant Dead': 495 },
  GoldenDeva: {
    'Boss Dead': 315,
    'Mutant Spawning': 135,
    'Mutant Dead': 495,
  },
  Bulbari: { 'Boss Dead': 315, 'Mutant Spawning': 135, 'Mutant Dead': 495 },
};

const alertSound = new Audio('/alert.mp3');
const silentSound = new Audio('/silence.mp3');

export default function App() {
  const [selectedBoss, setSelectedBoss] = useState(
    () => localStorage.getItem('selectedBoss') || 'Jiangshi'
  );
  const TIMER_VALUES = BOSS_TIMERS[selectedBoss];
  const [timers, setTimers] = useState([]);
  const [volume, setVolume] = useState(
    () => parseFloat(localStorage.getItem('volume')) || 0.5
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(
    () => JSON.parse(localStorage.getItem('audioEnabled')) || false
  );
  const [interactionOccurred, setInteractionOccurred] = useState(false);
  const channelRef = useRef([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userCount, setUserCount] = useState(0);

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

  const handleStartTimer = (type, index) => {
    const channelValue = channelRef.current[index].current?.value?.trim();
    if (
      !channelValue ||
      isNaN(channelValue) ||
      channelValue < 1 ||
      channelValue > 50
    ) {
      console.error('Wrong channel number');
      return;
    }
    startTimer(channelValue, type);
  };

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

  return (
    <div className="p-2 sm:p-4 max-w-full mx-auto text-white bg-gray-900/95 min-h-screen flex items-center justify-center w-full h-full overflow-auto flex-wrap backdrop-blur-sm">
      <style>
        {`
          @keyframes blink {
            0% { background-color: rgba(239, 68, 68, 0.7); }
            50% { background-color: transparent; }
            100% { background-color: rgba(239, 68, 68, 0.7); }
          }
          .blink {
            animation: blink 1s infinite;
          }
          html, body, #root {
            height: 100%;
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #1a1a1a 0%, #2d3748 100%);
          }
          @media (max-width: 640px) {
            .grid {
              grid-template-columns: 1fr;
            }
            .flex-wrap {
              flex-wrap: wrap;
            }
          }
          .glass {
            background: rgba(31, 41, 55, 0.4);
            backdrop-filter: blur(8px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
          }
          .glass-hover:hover {
            background: rgba(31, 41, 55, 0.6);
            transition: all 0.3s ease;
          }
        `}
      </style>
      <div className="w-full max-w-7xl px-2 sm:px-4 flex flex-col items-center justify-center">
        <div className="flex flex-col sm:flex-row items-center justify-between w-full relative mb-4 gap-2">
          <div className="flex-1"></div>
          <div className="flex flex-col sm:flex-row items-center gap-2 relative sm:absolute sm:left-1/2 sm:transform sm:-translate-x-1/2 flex-grow">
            <h1 className="text-xl sm:text-2xl text-center sm:text-nowrap font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">
              Field Boss Timer ({selectedBoss})
            </h1>
            <div className="relative group flex items-center">
              <HelpCircle className="text-white/90 cursor-pointer" size={24} />
              <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 w-64 p-2 text-sm glass text-white/90 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <p>
                  <strong>Boss Dead</strong> - Click when boss is killed
                </p>
                <p>
                  <strong>Mutant Spawning</strong> - Click when lightning
                  spawns after boss is killed
                </p>
                <p>
                  <strong>Mutant Dead</strong> - Click when lightning boss is
                  killed
                </p>
              </div>
            </div>
            <select
              className="p-2 glass text-white/90 rounded glass-hover"
              value={selectedBoss}
              onChange={(e) => setSelectedBoss(e.target.value)}
            >
              {Object.keys(BOSS_TIMERS).map((boss) => (
                <option key={boss} value={boss} className="bg-gray-800">
                  {boss}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleAudio} className="glass p-2 rounded-full glass-hover">
              {audioEnabled ? (
                <Volume2 className="text-white/90" size={24} />
              ) : (
                <VolumeX className="text-white/90" color="rgba(239, 68, 68, 0.9)" size={24} />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
              className="w-20 sm:w-24 accent-white/90"
            />
          </div>
        </div>
        <div className="text-sm text-white/70 mb-4">
          Active Users: {userCount}
        </div>
        <div className="mb-4 p-2 sm:p-4 glass rounded-lg w-full text-center">
          <h2 className="text-lg sm:text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">Boss Timeline</h2>
          {timers.length === 0 ? (
            <p className="text-white/70">No active timers.</p>
          ) : (
            timers.map((t, index) => {
              const adjustedTimeLeft = t.timeLeft - 15;
              return (
                <div
                  key={index}
                  className={`mt-2 p-2 rounded-lg text-white/90 text-center text-sm sm:text-base ${
                    t.timeLeft <= 15 ? 'bg-green-700/70 backdrop-blur-sm'
                      : t.timeLeft <= 25 && t.timeLeft > 15 ? 'blink'
                      : t.type === 'Mutant Spawning' ? 'bg-purple-700/70 backdrop-blur-sm'
                      : 'glass'
                  }`}
                >
                  {t.channel} channel - {t.type} - {t.timeLeft >= 15 && Math.floor(adjustedTimeLeft / 60)}:
                  {t.timeLeft >= 15 && String(adjustedTimeLeft % 60).padStart(2, '0')}
                  {t.timeLeft <= 15 && " SPAWNED"}
                </div>
              );
            })
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4 w-full">
          {[...Array(5)].map((_, i) => (
            <div className="p-2 sm:p-4 glass rounded-lg flex flex-col items-center text-nowrap" key={i}>
              <input
                type="text"
                placeholder="Enter channel (1-50)"
                ref={channelRef.current[i]}
                className="p-2 glass text-white/90 rounded w-full text-center mb-2 sm:mb-4 text-sm sm:text-base placeholder-white/50"
              />

              {Object.keys(TIMER_VALUES).map((type) => (
                <button
                  key={type}
                  className={`mt-1 sm:mt-2 w-full p-2 rounded text-sm sm:text-base transition-all duration-300 ${
                    type === 'Boss Dead'
                      ? 'bg-red-600/70 hover:bg-red-700/90 backdrop-blur-sm'
                      : type === 'Mutant Spawning'
                      ? 'bg-purple-600/70 hover:bg-purple-700/90 backdrop-blur-sm'
                      : 'bg-blue-600/70 hover:bg-blue-700/90 backdrop-blur-sm'
                  }`}
                  onClick={() => handleStartTimer(type, i)}
                >
                  {type}
                </button>
              ))}
            </div>
          ))}
        </div>

        <footer className="mt-auto text-white/50 text-sm text-center w-full py-2">
          Created by Lolicaust © {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
}
