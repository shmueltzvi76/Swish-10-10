import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Target, Plus, TrendingUp, Trophy, Flame, Settings, Trash2, Edit3, ChevronDown, BarChart2, X, Filter, Activity } from 'lucide-react';

// === מיקומי המגרש המעודכנים מתמטית ברמת הפיקסל! ===
// מערכת הצירים: 100 רוחב על 125 גובה
// קו עונשין = Y:55, לוח סל = Y:12
const SPOTS = [
  // שמאל (קרוב לרחוק) - יושבים על הקו השמאלי (X=25).
  { id: 1, name: 'שמאל 1 (מאחורי הקרש)', group: 'צד שמאל', x: 25, y: 6 },
  { id: 2, name: 'שמאל 2', group: 'צד שמאל', x: 25, y: 17 },
  { id: 3, name: 'שמאל 3', group: 'צד שמאל', x: 25, y: 27 },
  { id: 4, name: 'שמאל 4', group: 'צד שמאל', x: 25, y: 37 },
  { id: 5, name: 'שמאל 5', group: 'צד שמאל', x: 25, y: 48 },

  // אופקי (בדיוק על קו העונשין Y=55. כולם בתוך גבולות הבקבוק X: 25-75)
  { id: 6, name: 'עונשין שמאל חוץ (2)', group: 'אופקי', x: 25, y: 55 },
  { id: 7, name: 'עונשין שמאל פנים (6)', group: 'אופקי', x: 34, y: 55 },
  { id: 8, name: 'עונשין ימין פנים (6)', group: 'אופקי', x: 66, y: 55 },
  { id: 9, name: 'עונשין ימין חוץ (2)', group: 'אופקי', x: 75, y: 55 },

  // ימין (רחוק לקרוב) - יושבים על הקו הימני (X=75).
  { id: 10, name: 'ימין 1 (רחוק)', group: 'צד ימין', x: 75, y: 48 },
  { id: 11, name: 'ימין 2', group: 'צד ימין', x: 75, y: 37 },
  { id: 12, name: 'ימין 3', group: 'צד ימין', x: 75, y: 27 },
  { id: 13, name: 'ימין 4', group: 'צד ימין', x: 75, y: 17 },
  { id: 14, name: 'ימין 5 (מאחורי הקרש)', group: 'צד ימין', x: 75, y: 6 },

  // מול הסל: בדיוק באמצע (X=50)
  { id: 15, name: 'קצה הבקבוק (קשת עונשין)', group: 'מול הסל', x: 50, y: 80 },
  { id: 16, name: 'עונשין (אמצע)', group: 'מול הסל', x: 50, y: 55 },
  { id: 17, name: 'אמצע הצבע (8)', group: 'מול הסל', x: 50, y: 30 },
  { id: 18, name: 'מתחת לסל', group: 'מול הסל', x: 50, y: 22 },

  // שלשות: פינות בקו ישר לסל (אותו Y:16 של הסל עצמו), קו אמצע על קשת אמיתית שסוגרת עליהן ברדיוס 74 סביב הסל
  { id: 19, name: 'שלשה פינה שמאל', group: 'שלשות', x: 6, y: 16 },
  { id: 20, name: 'שלשה אמצע', group: 'שלשות', x: 50, y: 90 },
  { id: 21, name: 'שלשה פינה ימין', group: 'שלשות', x: 94, y: 16 }
];

const GROUP_ORDER = ['צד שמאל', 'אופקי', 'צד ימין', 'מול הסל', 'שלשות'];

const STORAGE_DATA_KEY = 'swish_pro_data_v19';
const STORAGE_SETTINGS_KEY = 'swish_pro_settings_v19';

const INITIAL_SESSION = {
  id: 1715000000000,
  date: new Date().toISOString(),
  targetShots: 10,
  data: {
    1: 1, 2: 4, 3: 1, 4: 3, 5: 5,
    6: 2, 7: 6, 8: 6, 9: 2,
    10: 4, 11: 6, 12: 7, 13: 5, 14: 2,
    15: 4, 16: 4, 17: 8, 18: 9,
    19: 2, 20: 4, 21: 4
  }
};

// === תפריט מותאם אישית ===
const CustomDropdown = ({ value, options, onChange, icon: Icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(o => o.value === value);

  return (
    <div className="relative w-full">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-[#161920] text-white font-bold text-sm border border-[#3A4155] rounded-xl py-3 px-4 focus:outline-none focus:border-[#FF8A00] shadow-sm transition-all"
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon size={16} className="text-[#FF8A00]" />}
          <span className="text-white truncate">
            {selectedOption ? selectedOption.label : 'בחר...'}
          </span>
        </div>
        <ChevronDown size={16} className={`text-[#FF8A00] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute top-full left-0 right-0 mt-2 bg-[#1C202A] border border-[#3A4155] rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-50 overflow-hidden animate-in fade-in zoom-in-95 max-h-56 overflow-y-auto">
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
                className={`w-full text-right px-4 py-3.5 text-sm font-bold transition-colors border-b border-[#2A2F3D]/50 last:border-0
                  ${value === opt.value ? 'bg-[#FF8A00]/10 text-[#FF8A00]' : 'text-[#E0E2E7] hover:bg-[#2A2F3D]'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// === הזנה משולבת ===
const HybridInput = ({ value, onChange, max }) => {
  const [isOpen, setIsOpen] = useState(false);
  const safeMax = Number.isFinite(max) && max > 0 ? max : 10;

  return (
    <div className="relative flex-shrink-0">
      <div className="relative">
        <input
          type="number"
          min="0"
          max={safeMax}
          value={value !== undefined ? value : ''}
          onClick={() => setIsOpen(true)}
          className="appearance-none w-[85px] bg-[#0F1115] text-white font-black text-lg rounded-xl pr-3 pl-8 py-2.5 border border-[#3A4155] focus:border-[#FF8A00] focus:ring-1 focus:ring-[#FF8A00] outline-none transition-all text-center shadow-inner"
          placeholder="-"
          style={{ direction: 'ltr' }}
          readOnly
        />
        <ChevronDown className="w-4 h-4 text-[#FF8A00] absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute top-full right-0 mt-2 w-[120px] bg-[#1C202A] border border-[#3A4155] rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] z-50 max-h-48 overflow-y-auto flex flex-col animate-in fade-in zoom-in-95">
            {Array.from({length: safeMax + 1}, (_, i) => (
              <button
                key={i}
                onClick={(e) => { e.preventDefault(); onChange(i); setIsOpen(false); }}
                className="py-3 text-center font-black text-white hover:bg-[#FF8A00] hover:text-black border-b border-[#2A2F3D]/50 last:border-0 transition-colors"
              >
                {i}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// === גרף אינטראקטיבי מושלם ===
const SmartLineChart = ({ data }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (data && data.length > 0) setActiveIndex(data.length - 1);
  }, [data]);

  if (!data || data.length === 0) return <div className="text-[#848B98] text-center py-6 text-sm">אין נתונים להצגת גרף</div>;

  const chartData = [...data].reverse();
  const maxPoints = Math.max(chartData.length, 2);
  const safeActiveIndex = Math.min(activeIndex, chartData.length - 1);
  const activeData = chartData[safeActiveIndex] || chartData[chartData.length - 1];

  const getX = (index) => 8 + (index / (maxPoints - 1)) * 84;
  const getSvgY = (percentage) => 100 - percentage;

  const svgPoints = chartData.map((d, i) => `${getX(i)},${getSvgY(d.percentage)}`).join(' ');

  return (
    <div className="w-full relative pt-2 pb-6">

      <div className="bg-[#0F1115] border border-[#3A4155] rounded-xl p-3 mb-6 flex justify-between items-center shadow-inner transition-all">
        <div>
          <p className="text-[#848B98] text-[10px] uppercase tracking-wider mb-0.5">{activeData.fullDate}</p>
          <p className="text-white font-bold text-xs">תוצאת אימון נבחר</p>
        </div>
        <div className="text-2xl font-black text-[#FF8A00] drop-shadow-md">
          {activeData.percentage.toFixed(0)}<span className="text-sm text-[#FF8A00]">%</span>
        </div>
      </div>

      <div className="relative h-32 border-b border-[#2A2F3D]">
        {[0, 50, 100].map(val => (
          <div key={val} className="absolute w-full border-t border-[#2A2F3D]/50" style={{ bottom: `${val}%` }}>
            <span className="absolute left-0 -top-2.5 text-[9px] text-[#596070] font-medium">{val}%</span>
          </div>
        ))}

        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
          {chartData.length > 1 && (
            <>
              <polygon points={`0,100 ${svgPoints} ${getX(chartData.length-1)},100`} fill="url(#orange-grad)" opacity="0.15"/>
              <polyline points={svgPoints} fill="none" stroke="#FF8A00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </>
          )}
          <defs>
            <linearGradient id="orange-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF8A00" stopOpacity="1" />
              <stop offset="100%" stopColor="#FF8A00" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {chartData.map((d, i) => {
          const isActive = i === safeActiveIndex;

          return (
            <div
              key={i}
              className="absolute top-0 bottom-0 cursor-pointer flex flex-col items-center justify-end z-20 group"
              style={{ left: `calc(${getX(i)}% - 15px)`, width: '30px' }}
              onClick={() => setActiveIndex(i)}
            >
              {isActive && (
                <div className="absolute top-0 bottom-0 w-[1px] bg-transparent border-r border-dashed border-[#FF8A00]/50" style={{ left: '50%' }}></div>
              )}
              <div
                className={`absolute rounded-full transform -translate-x-1/2 translate-y-1/2 transition-all duration-300
                  ${isActive ? 'w-4 h-4 bg-[#FF8A00] border-[3px] border-[#1C202A] shadow-[0_0_12px_rgba(255,138,0,0.8)] z-30' : 'w-2 h-2 bg-[#0F1115] border-[2px] border-[#FF8A00]'}`}
                style={{ left: '50%', bottom: `${d.percentage}%` }}
              ></div>
            </div>
          );
        })}
      </div>

      <div className="relative h-6 mt-3 w-full">
        {chartData.map((d, i) => {
          const isActive = i === safeActiveIndex;
          return (
            <div
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`absolute transform -translate-x-1/2 text-[9px] text-center font-bold cursor-pointer transition-colors px-1.5 py-1 rounded-md whitespace-nowrap
                ${isActive ? 'text-[#FF8A00] bg-[#FF8A00]/10' : 'text-[#848B98] hover:text-[#E0E2E7]'}`}
              style={{ left: `${getX(i)}%`, top: 0 }}
            >
              {d.shortDate}
            </div>
          );
        })}
      </div>
    </div>
  );
};


export default function App() {
  const mainRef = useRef(null);
  const [activeTab, setActiveTab] = useState('court');
  const [sessions, setSessions] = useState([]);
  const [settings, setSettings] = useState({ targetShots: 10 });
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedSpotDetails, setSelectedSpotDetails] = useState(null);

  const [currentInput, setCurrentInput] = useState({});
  const [editingId, setEditingId] = useState(null);

  const [filterMode, setFilterMode] = useState('overall');
  const [filterZone, setFilterZone] = useState(GROUP_ORDER[0]);
  const [filterSpot, setFilterSpot] = useState(SPOTS[0].id);

  useEffect(() => {
    mainRef.current?.scrollTo(0, 0);
  }, [activeTab]);

  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_DATA_KEY);
    const savedSettings = localStorage.getItem(STORAGE_SETTINGS_KEY);

    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        if (parsedSettings && Number.isFinite(parsedSettings.targetShots) && parsedSettings.targetShots > 0) {
          setSettings(parsedSettings);
        }
      } catch {
        // ignore corrupted settings, keep defaults
      }
    }

    let parsedSessions = null;
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (Array.isArray(parsed) && parsed.length > 0) parsedSessions = parsed;
      } catch {
        // ignore corrupted data, fall back to initial session
      }
    }

    if (parsedSessions) {
      setSessions(parsedSessions);
    } else {
      setSessions([INITIAL_SESSION]);
      localStorage.setItem(STORAGE_DATA_KEY, JSON.stringify([INITIAL_SESSION]));
    }
  }, []);

  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem(STORAGE_DATA_KEY, JSON.stringify(sessions));
    }
    localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings));
  }, [sessions, settings]);

  const saveSession = () => {
    const entries = Object.entries(currentInput).filter(([, v]) => v !== '' && v !== undefined && v !== null);
    if (entries.length === 0) return;
    const cleanedInput = Object.fromEntries(entries);

    if (editingId) {
      const updatedSessions = sessions.map(s =>
        s.id === editingId ? { ...s, data: cleanedInput } : s
      );
      setSessions(updatedSessions);
    } else {
      const newSession = {
        id: Date.now(),
        date: new Date().toISOString(),
        targetShots: settings.targetShots,
        data: cleanedInput
      };
      setSessions([newSession, ...sessions]);
    }

    setCurrentInput({});
    setEditingId(null);
    setActiveTab('stats');
  };

  const handleInput = (id, val) => {
    setCurrentInput(prev => ({ ...prev, [id]: val }));
  };

  const handleEdit = (session) => {
    setEditingId(session.id);
    setCurrentInput(session.data);
    setActiveTab('input');
  };

  const handleDelete = (id) => {
    if (window.confirm('האם למחוק אימון זה?')) {
      const filtered = sessions.filter(s => s.id !== id);
      setSessions(filtered);
      if (filtered.length === 0) localStorage.removeItem(STORAGE_DATA_KEY);
      if (editingId === id) {
        setEditingId(null);
        setCurrentInput({});
      }
    }
  };

  const clearAllData = () => {
    if (window.confirm('אזהרה: כל היסטוריית האימונים תימחק לצמיתות. להמשיך?')) {
      setSessions([]);
      setEditingId(null);
      setCurrentInput({});
      localStorage.removeItem(STORAGE_DATA_KEY);
      setShowSettingsModal(false);
      setActiveTab('court');
    }
  };

  const handleSpotClick = (spotId) => {
    const spot = SPOTS.find(s => s.id === spotId);
    const session1 = sessions[0];
    const session2 = sessions.length > 1 ? sessions[1] : null;

    const getStats = (session) => {
      if (!session || session.data[spotId] === undefined) return null;
      const made = session.data[spotId];
      const target = session.targetShots;
      return {
        made,
        target,
        perc: target > 0 ? Math.round((made / target) * 100) : 0
      };
    };

    setSelectedSpotDetails({
      name: spot.name,
      s1: getStats(session1),
      s2: getStats(session2)
    });
  };

  const latestSession = sessions[0] || null;
  const previousSession = editingId ? sessions.find(s => s.id !== editingId) : (sessions.length > 1 ? sessions[1] : null);

  const currentTargetShots = editingId
    ? (sessions.find(s => s.id === editingId)?.targetShots || settings.targetShots)
    : settings.targetShots;

  const latestSessionPerc = useMemo(() => {
    if (!latestSession) return 0;
    const values = Object.values(latestSession.data);
    const total = values.length * latestSession.targetShots;
    if (total === 0) return 0;
    const made = values.reduce((a, b) => a + b, 0);
    return Math.round((made / total) * 100);
  }, [latestSession]);

  const stats = useMemo(() => {
    if (!sessions.length) return null;
    let totalMade = 0, totalShots = 0;
    let lastMade = 0, lastShots = 0;

    const zoneData = {};
    GROUP_ORDER.forEach(g => zoneData[g] = {
      allTimeMade: 0, allTimeAttempts: 0,
      lastMade: 0, lastAttempts: 0
    });

    sessions.forEach((session, idx) => {
      const isLast = idx === 0;
      Object.entries(session.data).forEach(([idStr, made]) => {
        const spot = SPOTS.find(s => s.id === parseInt(idStr, 10));
        if (spot) {
          totalMade += made;
          totalShots += session.targetShots;
          zoneData[spot.group].allTimeMade += made;
          zoneData[spot.group].allTimeAttempts += session.targetShots;

          if (isLast) {
            lastMade += made;
            lastShots += session.targetShots;
            zoneData[spot.group].lastMade += made;
            zoneData[spot.group].lastAttempts += session.targetShots;
          }
        }
      });
    });

    return {
      totalMade,
      totalShots,
      overallPerc: totalShots > 0 ? Math.round((totalMade / totalShots) * 100) : 0,
      lastMade,
      lastShots,
      lastPerc: lastShots > 0 ? Math.round((lastMade / lastShots) * 100) : 0,
      zoneData
    };
  }, [sessions]);

  const graphData = useMemo(() => {
    return sessions.map(session => {
      let made = 0, total = 0;

      if (filterMode === 'overall') {
        Object.values(session.data).forEach(v => made += v);
        total = Object.keys(session.data).length * session.targetShots;
      }
      else if (filterMode === 'zone') {
        SPOTS.filter(s => s.group === filterZone).forEach(spot => {
          if(session.data[spot.id] !== undefined) {
            made += session.data[spot.id];
            total += session.targetShots;
          }
        });
      }
      else if (filterMode === 'spot') {
        if(session.data[filterSpot] !== undefined) {
          made += session.data[filterSpot];
          total = session.targetShots;
        }
      }

      const dateObj = new Date(session.date);
      return {
        shortDate: dateObj.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' }),
        fullDate: dateObj.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }),
        percentage: total > 0 ? (made / total) * 100 : 0,
        hasData: total > 0
      };
    }).filter(d => d.hasData);
  }, [sessions, filterMode, filterZone, filterSpot]);

  const filterModeOptions = [
    { value: 'overall', label: 'ממוצע כולל (סה"כ)' },
    { value: 'zone', label: 'לפי אזור במגרש' },
    { value: 'spot', label: 'לפי עמדה ספציפית' }
  ];

  const zoneOptions = GROUP_ORDER.map(g => ({ value: g, label: g }));
  const spotOptions = SPOTS.map(s => ({ value: s.id, label: s.name }));


  return (
    <div className="h-dvh flex flex-col overflow-hidden bg-[#0F1115] text-[#E0E2E7] font-sans selection:bg-[#FF8A00]/30" dir="rtl">

      {/* ===================== מודל פרטי נקודה ===================== */}
      {selectedSpotDetails && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => setSelectedSpotDetails(null)}
        >
          <div
            className="bg-[#1C202A] p-6 rounded-3xl border border-[#2A2F3D] shadow-2xl w-full max-w-[320px] transform scale-100 animate-in zoom-in-95"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-xl font-black text-white">{selectedSpotDetails.name}</h3>
              <button onClick={() => setSelectedSpotDetails(null)} className="text-[#848B98] hover:text-white bg-[#0F1115] rounded-full p-2 transition-colors border border-[#2A2F3D]">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-[#0F1115] p-5 rounded-2xl border border-[#2A2F3D]">
                 <p className="text-[#FF8A00] text-xs font-bold uppercase tracking-wider mb-2">אימון אחרון</p>
                 {selectedSpotDetails.s1 ? (
                    <div className="flex justify-between items-end">
                       <span className="text-4xl font-black text-white">{selectedSpotDetails.s1.perc}<span className="text-2xl text-[#FF8A00]">%</span></span>
                       <span dir="ltr" className="text-[#A0A6B1] text-sm font-medium mb-1">({selectedSpotDetails.s1.made}/{selectedSpotDetails.s1.target})</span>
                    </div>
                 ) : <p className="text-[#848B98] text-sm">לא נזרק באימון זה</p>}
              </div>

              <div className="bg-[#0F1115] p-5 rounded-2xl border border-[#2A2F3D]/50 opacity-80">
                 <p className="text-[#848B98] text-xs font-bold uppercase tracking-wider mb-2">אימון קודם</p>
                 {selectedSpotDetails.s2 ? (
                    <div className="flex justify-between items-end">
                       <span className="text-3xl font-bold text-white">{selectedSpotDetails.s2.perc}%</span>
                       <span dir="ltr" className="text-[#848B98] text-sm mb-1">({selectedSpotDetails.s2.made}/{selectedSpotDetails.s2.target})</span>
                    </div>
                 ) : <p className="text-[#848B98] text-sm">אין נתונים מהאימון הקודם</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="shrink-0 bg-[#161920] border-b border-[#252A36] pt-8 pb-4 px-5 shadow-md">
        <div className="flex justify-between items-center max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#FF8A00] to-[#E55D00] rounded-xl flex items-center justify-center shadow-lg shadow-[#FF8A00]/20">
              <Trophy className="text-white w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight uppercase" style={{fontFamily: 'Impact, sans-serif'}}>
                SWISH 10/10
              </h1>
            </div>
          </div>
          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-2.5 rounded-full bg-[#1C202A] text-[#848B98] border border-[#2A2F3D] hover:text-[#FF8A00] transition-colors"
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      <main ref={mainRef} className="flex-1 min-h-0 overflow-y-auto w-full max-w-md mx-auto relative">

        {/* מודל הגדרות */}
        {showSettingsModal && (
          <div className="fixed inset-0 z-40 bg-[#0F1115]/95 backdrop-blur-sm p-6 overflow-y-auto animate-in fade-in">
            <div className="bg-[#1C202A] rounded-3xl p-6 border border-[#2A2F3D] shadow-2xl mt-10">
              <h2 className="text-xl font-bold text-white mb-6">הגדרות אימון</h2>

              <div className="mb-8">
                <label className="block text-sm font-medium text-[#A0A6B1] mb-3">
                  יעד זריקות לכל עמדה
                </label>
                <div className="flex items-center gap-4 bg-[#0F1115] p-3 rounded-2xl border border-[#2A2F3D]">
                  <input
                    type="number"
                    min="1"
                    value={settings.targetShots}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === '') { setSettings({ targetShots: '' }); return; }
                      const v = parseInt(raw, 10);
                      if (Number.isFinite(v) && v >= 1) setSettings({ targetShots: v });
                    }}
                    onBlur={() => {
                      if (!Number.isFinite(settings.targetShots) || settings.targetShots < 1) {
                        setSettings({ targetShots: 10 });
                      }
                    }}
                    className="w-20 bg-transparent text-center text-3xl font-black text-[#FF8A00] outline-none"
                  />
                  <span className="text-[#848B98] text-xs leading-relaxed">זריקות (ישפיע רק על<br/>אימונים חדשים שתפתח)</span>
                </div>
              </div>

              <div className="border-t border-[#2A2F3D] pt-6">
                <button
                  onClick={clearAllData}
                  className="w-full bg-red-500/10 text-red-500 font-bold py-4 rounded-xl border border-red-500/20 hover:bg-red-500/20 flex items-center justify-center gap-2"
                >
                  <Trash2 size={18} /> מחיקת כל הנתונים
                </button>
              </div>

              <button
                onClick={() => setShowSettingsModal(false)}
                className="w-full mt-4 bg-[#FF8A00] text-black font-black text-lg py-4 rounded-xl shadow-lg shadow-[#FF8A00]/20"
              >
                סגור חלון
              </button>
            </div>
          </div>
        )}

        {/* מגרש ראשי */}
        {activeTab === 'court' && !showSettingsModal && (
          <div className="h-full flex flex-col p-4 animate-in fade-in">
            <div className="shrink-0 bg-[#1C202A] p-4 rounded-2xl mb-5 border border-[#2A2F3D] flex justify-between items-center shadow-lg">
              <div>
                <p className="text-[#848B98] text-[10px] font-bold uppercase tracking-wider mb-1">
                  האימון האחרון
                </p>
                <p className="text-white font-medium text-sm">
                  {latestSession ? new Date(latestSession.date).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'numeric' }) : 'אין נתונים'}
                </p>
              </div>
              <div className="text-left bg-gradient-to-br from-[#FF8A00]/20 to-[#FF8A00]/5 px-4 py-2 rounded-xl border border-[#FF8A00]/20">
                <p className="text-[#FF8A00] text-xl font-black">{latestSessionPerc}%</p>
              </div>
            </div>

            {/* איור מגרש מותאם מתמטית לחלוטין (viewBox: 0 0 100 125), מוקטן לפי הגובה הפנוי כדי שלא יגלוש */}
            <div className="flex-1 min-h-0 flex items-center justify-center">
            <div className="relative h-full max-w-full aspect-[4/5] bg-[#C28657] rounded-3xl border-[6px] border-white shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden">
              <div className="absolute inset-0 opacity-15 flex flex-col justify-around pointer-events-none">
                {[...Array(25)].map((_, i) => (
                  <div key={i} className="h-[2px] bg-black/40 w-full shadow-[0_1px_1px_rgba(255,255,255,0.1)]" />
                ))}
              </div>

              <svg viewBox="0 0 100 125" className="absolute inset-0 w-full h-full opacity-90 pointer-events-none">
                {/* הבקבוק */}
                <rect x="25" y="0" width="50" height="55" fill="#A46D42" stroke="white" strokeWidth="1.2" />
                {/* קשת עונשין פנימית וחיצונית */}
                <path d="M 25 55 A 25 25 0 0 0 75 55" fill="none" stroke="white" strokeWidth="1.2" />
                <path d="M 25 55 A 25 25 0 0 1 75 55" fill="none" stroke="white" strokeDasharray="2 2" strokeWidth="1.2" />
                {/* סל וקרש */}
                <line x1="38" y1="12" x2="62" y2="12" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="50" cy="16" r="3.5" fill="#FF4D4D" stroke="white" strokeWidth="1" />

                {/* קשת 3 - קווים ישרים בפינות (X:6/94) עד גובה הסל, ואז קשת אמיתית ברדיוס 74 סביב מרכז הסל (50,16) */}
                <path d="M 6 0 L 6 75.5 A 74 74 0 0 0 94 75.5 L 94 0" fill="none" stroke="white" strokeWidth="1.2" />
              </svg>

              {SPOTS.map((spot) => {
                const score = latestSession?.data[spot.id];
                if (score === undefined) return null;
                return (
                  <button
                    key={spot.id}
                    onClick={() => handleSpotClick(spot.id)}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center cursor-pointer transition-transform hover:scale-110 active:scale-95 z-10 w-9 h-9"
                    // המרה ל-125 בגובה
                    style={{ left: `${spot.x}%`, top: `${(spot.y / 125) * 100}%`, pointerEvents: 'auto' }}
                  >
                    <span
                      className="text-white font-black text-[18px]"
                      style={{
                        textShadow: '0px 2px 4px rgba(0,0,0,1), 0px 0px 8px rgba(0,0,0,0.8)',
                        fontFamily: 'Impact, sans-serif'
                      }}
                    >
                      {score}
                    </span>
                  </button>
                );
              })}
            </div>
            </div>

            <div className="shrink-0 text-center mt-5 bg-[#1C202A] p-3 rounded-xl border border-[#2A2F3D]">
              <p className="text-[#E0E2E7] text-[11px] font-medium leading-relaxed">
                מוצגות קליעות מהאימון האחרון מתוך <span className="text-[#FF8A00] font-bold">{latestSession?.targetShots || settings.targetShots} זריקות</span>.
              </p>
              <p className="text-[#848B98] text-[10px] mt-1.5 flex items-center justify-center gap-1">
                <Target size={12} /> לחץ על כל מספר במגרש כדי לראות סטטיסטיקה
              </p>
            </div>
          </div>
        )}

        {/* הזנה ועריכה */}
        {activeTab === 'input' && !showSettingsModal && (
          <div className="p-4 animate-in slide-in-from-bottom-4 pb-10">
            <div className="mb-6 flex justify-between items-end">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">
                  {editingId ? 'עריכת אימון' : 'הזנת תוצאות'}
                </h2>
                <p className="text-sm text-[#848B98]">מתוך {currentTargetShots} זריקות לכל עמדה</p>
              </div>
              {editingId && (
                <button onClick={() => { setEditingId(null); setCurrentInput({}); setActiveTab('stats'); }} className="text-[#848B98] text-sm underline px-2 py-1">
                  ביטול
                </button>
              )}
            </div>

            <div className="space-y-6">
              {GROUP_ORDER.map(group => (
                <div key={group} className="bg-[#1C202A] rounded-2xl border border-[#2A2F3D] shadow-lg overflow-hidden">
                  <div className="bg-[#212631] px-4 py-3 border-b border-[#2A2F3D] flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#FF8A00]/20 flex items-center justify-center">
                      <Target className="text-[#FF8A00] w-3.5 h-3.5" />
                    </div>
                    <h3 className="font-bold text-white text-sm tracking-wide">{group}</h3>
                  </div>

                  <div className="p-2 divide-y divide-[#2A2F3D]/50">
                    {SPOTS.filter(s => s.group === group).map(spot => {
                      const val = currentInput[spot.id];
                      const prevScore = previousSession?.data[spot.id];

                      return (
                        <div key={spot.id} className="flex items-center justify-between p-2">
                          <div>
                            <span className="text-[#E0E2E7] font-bold text-sm block">{spot.name}</span>
                            <span className="text-[#596070] text-[10px] font-bold">
                              {prevScore !== undefined ? `אימון קודם: קלעת ${prevScore}` : 'טרם הוזן בעבר'}
                            </span>
                          </div>

                          <HybridInput
                            value={val}
                            onChange={(v) => handleInput(spot.id, v)}
                            max={currentTargetShots}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={saveSession}
              className="w-full mt-8 bg-gradient-to-r from-[#FF8A00] to-[#E55D00] text-[#0F1115] font-black text-lg py-4 rounded-xl shadow-lg shadow-[#FF8A00]/20 active:scale-95 transition-all sticky bottom-0"
            >
              {editingId ? 'עדכן אימון' : 'שמור אימון'}
            </button>
          </div>
        )}

        {/* סטטיסטיקות */}
        {activeTab === 'stats' && stats && !showSettingsModal && (
          <div className="p-4 animate-in fade-in space-y-6 pb-10">

            {/* סיכום אימון אחרון! */}
            {latestSession && (
              <div className="bg-gradient-to-br from-[#1C202A] to-[#161920] rounded-3xl p-5 border border-[#FF8A00]/30 shadow-lg relative overflow-hidden">
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-[#FF8A00]/10 rounded-full blur-xl"></div>
                <div className="flex items-center gap-2 mb-2 relative z-10">
                  <Activity className="w-5 h-5 text-[#FF8A00]" />
                  <h3 className="text-white font-bold text-sm">האימון האחרון שלך</h3>
                </div>
                <div className="flex justify-between items-end relative z-10">
                  <div>
                    <p className="text-4xl font-black text-white leading-none">{stats.lastPerc}<span className="text-[#FF8A00] text-xl">%</span></p>
                  </div>
                  <div className="text-right">
                    <p dir="ltr" className="text-[#E0E2E7] font-bold">{stats.lastMade} / {stats.lastShots}</p>
                    <p className="text-[#848B98] text-[10px]">קליעות מהאימון האחרון</p>
                  </div>
                </div>
              </div>
            )}

            {/* סיכום מכל האימונים */}
            <div className="flex gap-4">
              <div className="flex-1 bg-[#1C202A] rounded-2xl p-4 border border-[#2A2F3D] text-center shadow-sm">
                <Flame className="w-5 h-5 text-[#848B98] mx-auto mb-1" />
                <p className="text-[#848B98] text-[9px] font-bold uppercase">אחוז כל הזמנים</p>
                <p className="text-2xl font-black text-white mt-0.5">{stats.overallPerc}<span className="text-[#848B98] text-sm">%</span></p>
              </div>

              <div className="flex-1 bg-[#1C202A] rounded-2xl p-4 border border-[#2A2F3D] text-center shadow-sm flex flex-col justify-center">
                <p className="text-[#848B98] text-[9px] font-bold uppercase mb-1">סלי שדה (All-Time)</p>
                <div dir="ltr" className="flex items-baseline justify-center gap-1 mt-0.5">
                  <span className="text-xl font-bold text-white">{stats.totalMade}</span>
                  <span className="text-[#848B98] text-xs">/ {stats.totalShots}</span>
                </div>
              </div>
            </div>

            {/* גרף התקדמות */}
            <div className="bg-[#1C202A] rounded-3xl p-5 border border-[#2A2F3D] shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 size={18} className="text-[#FF8A00]" />
                <h3 className="text-white font-bold text-sm">גרף התקדמות</h3>
              </div>

              <div className="flex flex-col gap-3">
                <CustomDropdown
                  value={filterMode}
                  options={filterModeOptions}
                  onChange={setFilterMode}
                  icon={Filter}
                />

                {filterMode === 'zone' && (
                  <div className="animate-in slide-in-from-top-2 fade-in">
                    <CustomDropdown
                      value={filterZone}
                      options={zoneOptions}
                      onChange={setFilterZone}
                    />
                  </div>
                )}

                {filterMode === 'spot' && (
                  <div className="animate-in slide-in-from-top-2 fade-in">
                    <CustomDropdown
                      value={filterSpot}
                      options={spotOptions}
                      onChange={setFilterSpot}
                    />
                  </div>
                )}
              </div>

              <SmartLineChart data={graphData} />
            </div>

            {/* חלוקה לאזורים משודרגת - מראה גם אימון אחרון וגם כל הזמנים */}
            <div>
              <div className="flex justify-between items-end mb-3">
                <h3 className="text-white font-bold text-sm">חלוקה לאזורים</h3>
              </div>

              <div className="grid gap-3">
                {GROUP_ORDER.map(group => {
                  const data = stats.zoneData[group];
                  if (data.allTimeAttempts === 0) return null;

                  const lastPerc = data.lastAttempts > 0 ? Math.round((data.lastMade / data.lastAttempts) * 100) : 0;
                  const allPerc = Math.round((data.allTimeMade / data.allTimeAttempts) * 100);

                  return (
                    <div key={group} className="bg-[#1C202A] p-4 rounded-xl border border-[#2A2F3D]">
                      <h4 className="font-bold text-white text-sm mb-3 border-b border-[#2A2F3D] pb-2">{group}</h4>

                      {/* פס אימון אחרון */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-20">
                          <p className="text-[9px] text-[#FF8A00] font-bold uppercase">אימון אחרון</p>
                          <p dir="ltr" className="text-[11px] text-[#A0A6B1]">{data.lastMade}/{data.lastAttempts}</p>
                        </div>
                        <div className="flex-1 mx-3 bg-[#0F1115] h-1.5 rounded-full overflow-hidden shadow-inner">
                          <div className="h-full bg-[#FF8A00] rounded-full" style={{ width: `${lastPerc}%` }} />
                        </div>
                        <div className="w-8 text-right">
                          <span className="font-black text-white text-xs">{lastPerc}%</span>
                        </div>
                      </div>

                      {/* פס כל הזמנים */}
                      <div className="flex items-center justify-between opacity-70">
                        <div className="w-20">
                          <p className="text-[9px] text-[#848B98] font-bold uppercase">כל הזמנים</p>
                          <p dir="ltr" className="text-[11px] text-[#848B98]">{data.allTimeMade}/{data.allTimeAttempts}</p>
                        </div>
                        <div className="flex-1 mx-3 bg-[#0F1115] h-1.5 rounded-full overflow-hidden shadow-inner">
                          <div className="h-full bg-[#848B98] rounded-full" style={{ width: `${allPerc}%` }} />
                        </div>
                        <div className="w-8 text-right">
                          <span className="font-bold text-[#848B98] text-xs">{allPerc}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* היסטוריית אימונים */}
            <div>
              <h3 className="text-white font-bold text-sm mb-3 mt-4">היסטוריית אימונים</h3>
              <div className="space-y-3">
                {sessions.map((session, idx) => {
                  let sMade = 0;
                  let sTotal = Object.keys(session.data).length * session.targetShots;
                  Object.values(session.data).forEach(v => sMade += v);
                  const sPerc = sTotal > 0 ? Math.round((sMade / sTotal) * 100) : 0;

                  return (
                    <div key={session.id} className="bg-[#1C202A] p-4 rounded-xl border border-[#2A2F3D] flex justify-between items-center relative overflow-hidden group">
                      <div>
                        <p className="text-white font-bold text-sm">אימון {sessions.length - idx}</p>
                        <p className="text-[10px] text-[#848B98] mt-0.5">{new Date(session.date).toLocaleString('he-IL')}</p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right mr-2">
                          <p className="text-lg font-black text-[#FF8A00]">{sPerc}%</p>
                          <p className="text-[9px] text-[#848B98]"><span dir="ltr">{sMade}/{sTotal}</span> קליעות</p>
                        </div>

                        <div className="flex flex-col gap-1 border-r border-[#2A2F3D] pr-3">
                          <button onClick={() => handleEdit(session)} className="text-[#848B98] hover:text-white bg-[#0F1115] p-1.5 rounded-lg transition-colors">
                            <Edit3 size={14} />
                          </button>
                          <button onClick={() => handleDelete(session.id)} className="text-[#848B98] hover:text-red-500 bg-[#0F1115] p-1.5 rounded-lg transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}
      </main>

      {/* תפריט תחתון */}
      <nav className="shrink-0 w-full bg-[#161920]/95 backdrop-blur-md border-t border-[#2A2F3D] pb-safe shadow-[0_-10px_20px_rgba(0,0,0,0.3)]">
        <div className="max-w-md mx-auto flex justify-around p-2">
          <button onClick={() => {setActiveTab('court'); setShowSettingsModal(false);}} className={`flex flex-col items-center gap-1 transition-colors p-2 ${activeTab === 'court' && !showSettingsModal ? 'text-[#FF8A00]' : 'text-[#848B98]'}`}>
            <Target size={22} />
            <span className="text-[9px] font-bold tracking-wider">המגרש</span>
          </button>

          <button onClick={() => {setActiveTab('input'); setShowSettingsModal(false);}} className={`flex flex-col items-center gap-1 transition-colors p-2 ${activeTab === 'input' && !showSettingsModal ? 'text-white' : 'text-[#848B98]'}`}>
            <Plus size={22} />
            <span className="text-[9px] font-bold tracking-wider">{editingId ? 'ערוך אימון' : 'הזנה'}</span>
          </button>

          <button onClick={() => {setActiveTab('stats'); setShowSettingsModal(false);}} className={`flex flex-col items-center gap-1 transition-colors p-2 ${activeTab === 'stats' && !showSettingsModal ? 'text-[#FF8A00]' : 'text-[#848B98]'}`}>
            <TrendingUp size={22} />
            <span className="text-[9px] font-bold tracking-wider">סטטיסטיקות</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
