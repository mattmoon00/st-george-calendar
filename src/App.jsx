import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import './App.css';

const STORAGE_KEY = 'stg-reservations';
const COLOR_KEY = 'stg-user-colors';
const LOG_KEY = 'stg-audit-log';

function generatePastelColor(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 70%, 80%)`;
}

function App() {
  const [events, setEvents] = useState([]);
  const [userColors, setUserColors] = useState({});
  const [logs, setLogs] = useState([]);
  const [showLog, setShowLog] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedRange, setSelectedRange] = useState({ start: null, end: null });
  const [nameInput, setNameInput] = useState('');
  const [editingEvent, setEditingEvent] = useState(null);
  const initialLoadDone = useRef(false);

  useEffect(() => {
    const savedEvents = localStorage.getItem(STORAGE_KEY);
    const savedColors = localStorage.getItem(COLOR_KEY);
    const savedLogs = localStorage.getItem(LOG_KEY);

    if (savedEvents) {
      try {
        const parsed = JSON.parse(savedEvents);
        const fixed = parsed.map(event => ({
          ...event,
          id: event.id || Date.now().toString() + Math.random().toString(36).substr(2, 5),
        }));
        setEvents(fixed);
      } catch (e) {
        console.error('Failed to parse events:', e);
      }
    }

    if (savedColors) {
      try {
        const parsed = JSON.parse(savedColors);
        setUserColors(parsed);
      } catch (e) {
        console.error('Failed to parse user colors:', e);
      }
    }

    if (savedLogs) {
      try {
        const parsed = JSON.parse(savedLogs);
        setLogs(parsed);
      } catch (e) {
        console.error('Failed to parse logs:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (!initialLoadDone.current && events.length > 0) {
      initialLoadDone.current = true;
    }
    if (initialLoadDone.current) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
      localStorage.setItem(COLOR_KEY, JSON.stringify(userColors));
      localStorage.setItem(LOG_KEY, JSON.stringify(logs));
    }
  }, [events, userColors, logs]);

  const addLog = (action, name, start, end) => {
    const now = new Date().toLocaleString();
    const entry = { timestamp: now, action, name, start, end };
    console.log('Logging:', entry);
    setLogs(prev => [entry, ...prev]);
  };

  const handleSelect = (arg) => {
    setSelectedRange({ start: arg.startStr, end: arg.endStr });
    setNameInput('');
    setEditingEvent(null);
    setShowModal(true);
  };

  const handleEventClick = (clickInfo) => {
    const event = clickInfo.event;
    const id = event.id || event._def.publicId;
    const start = event.startStr;
    const end = event.endStr;

    setEditingEvent({ id, title: event.title, start, end });
    setNameInput(event.title);
    setSelectedRange({ start, end });
    setShowModal(true);
  };

  const isOverlap = (newStartStr, newEndStr, excludeId = null) => {
    const newStart = new Date(newStartStr);
    const newEnd = new Date(newEndStr);
    newEnd.setDate(newEnd.getDate() - 1);

    return events.some(event => {
      if (event.id === excludeId) return false;
      const existingStart = new Date(event.start);
      const existingEnd = new Date(event.end);
      existingEnd.setDate(existingEnd.getDate() - 1);

      return newStart <= existingEnd && newEnd >= existingStart;
    });
  };

  const handleSave = () => {
    if (!nameInput || !selectedRange.start || !selectedRange.end) return;

    const newStart = selectedRange.start;
    const newEnd = selectedRange.end;
    const excludeId = editingEvent?.id || null;

    if (isOverlap(newStart, newEnd, excludeId)) {
      alert('⛔ That reservation overlaps with an existing one.');
      return;
    }

    let colorMap = { ...userColors };
    let userColor = colorMap[nameInput];

    if (!userColor) {
      userColor = generatePastelColor(nameInput);
      colorMap[nameInput] = userColor;
      setUserColors(colorMap);
    }

    const updatedEvent = {
      id: editingEvent?.id || Date.now().toString() + Math.random().toString(36).substr(2, 5),
      title: nameInput,
      start: newStart,
      end: newEnd,
      allDay: true,
      backgroundColor: userColor,
      borderColor: userColor,
      textColor: '#1f2937',
      display: 'block'
    };

    if (editingEvent) {
      setEvents(events.map(ev => (ev.id === editingEvent.id ? updatedEvent : ev)));
      addLog('Updated', nameInput, newStart, newEnd);
    } else {
      setEvents([...events, updatedEvent]);
      addLog('Created', nameInput, newStart, newEnd);
    }

    setShowModal(false);
    setEditingEvent(null);
  };

  const handleDelete = () => {
    if (!editingEvent) return;
    setEvents(events.filter(ev => ev.id !== editingEvent.id));
    addLog('Deleted', editingEvent.title, editingEvent.start, editingEvent.end);
    setShowModal(false);
    setEditingEvent(null);
  };

  return (
    <div className="App">
      <h1>🏜️ St. George Vacation Home Calendar</h1>
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        selectable={true}
        select={handleSelect}
        eventClick={handleEventClick}
        events={events}
        eventDisplay="block"
        eventColor=""
      />

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>{editingEvent ? 'Edit Reservation' : 'New Reservation'}</h2>
            <div style={{ marginBottom: '15px' }}>
              <label>Start Date:</label>
              <input
                type="date"
                value={selectedRange.start}
                onChange={(e) => setSelectedRange({ ...selectedRange, start: e.target.value })}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label>End Date:</label>
              <input
                type="date"
                value={selectedRange.end}
                onChange={(e) => setSelectedRange({ ...selectedRange, end: e.target.value })}
              />
            </div>
            <input
              type="text"
              placeholder="Your name"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
            />
            <div className="modal-buttons">
              <button onClick={handleSave}>{editingEvent ? 'Update' : 'Reserve'}</button>
              {editingEvent && (
                <button onClick={handleDelete} style={{ backgroundColor: '#ef4444', color: 'white' }}>
                  Delete
                </button>
              )}
              <button onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Log Button + Panel */}
      <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999 }}>
        <button
          onClick={() => setShowLog(!showLog)}
          style={{ padding: '8px 12px', fontSize: '14px', borderRadius: '6px', backgroundColor: '#333', color: 'white', border: 'none' }}
        >
          {showLog ? 'Hide Log' : 'Show Log'}
        </button>

        {showLog && (
          <div style={{ marginTop: '10px', backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '8px', padding: '10px', width: '300px', maxHeight: '250px', overflowY: 'auto', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
            <h4 style={{ marginTop: 0 }}>📜 Activity Log</h4>
            {logs.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: '#666' }}>No activity yet.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {logs.map((log, index) => (
                  <li key={index} style={{ marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                    <strong>{log.timestamp}</strong><br />
                    {log.name} <em>{log.action}</em><br />
                    {log.start} → {log.end}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;