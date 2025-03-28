import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

const generatePastelColor = (name) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 70%, 80%)`;
};

export default function MobileCalendar() {
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [selectedRange, setSelectedRange] = useState({ start: "", end: "" });
  const [editingEvent, setEditingEvent] = useState(null);

  const eventsRef = collection(db, "reservations");

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const snapshot = await getDocs(eventsRef);
        const loaded = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
          display: "block",
        }));
        setEvents(loaded);
      } catch (err) {
        console.error("Error loading events:", err);
      }
    };
    fetchEvents();
  }, []);

  const handleSelect = (arg) => {
    setSelectedRange({ start: arg.startStr, end: arg.endStr });
    setNameInput("");
    setEditingEvent(null);
    setShowModal(true);
  };

  const handleEventClick = (clickInfo) => {
    const event = events.find((e) => e.id === clickInfo.event.id);
    if (!event) return;

    setSelectedRange({ start: event.start, end: event.end });
    setNameInput(event.title);
    setEditingEvent(event);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!nameInput || !selectedRange.start || !selectedRange.end) return;

    const color = generatePastelColor(nameInput);
    const eventData = {
      title: nameInput,
      start: selectedRange.start,
      end: selectedRange.end,
      allDay: true,
      backgroundColor: color,
      borderColor: color,
      textColor: "#1f2937",
    };

    try {
      if (editingEvent) {
        const ref = doc(db, "reservations", editingEvent.id);
        await updateDoc(ref, eventData);
        setEvents(events.map((e) => (e.id === editingEvent.id ? { ...eventData, id: e.id } : e)));
      } else {
        const docRef = await addDoc(eventsRef, eventData);
        setEvents([...events, { ...eventData, id: docRef.id }]);
      }
    } catch (err) {
      console.error("Error saving event:", err);
    }

    handleCancel();
  };

  const handleDelete = async () => {
    if (!editingEvent) return;

    try {
      await deleteDoc(doc(db, "reservations", editingEvent.id));
      setEvents(events.filter((e) => e.id !== editingEvent.id));
    } catch (err) {
      console.error("Error deleting event:", err);
    }

    handleCancel();
  };

  const handleCancel = () => {
    setShowModal(false);
    setNameInput("");
    setSelectedRange({ start: "", end: "" });
    setEditingEvent(null);
  };

  return (
    <div className="mobile-container">
      <div className="mobile-header">
        <h2>St. George Calendar</h2>
      </div>

      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        selectable={true}
        select={handleSelect}
        eventClick={handleEventClick}
        events={events}
        height="auto"
        contentHeight="auto"
        expandRows={true}
        eventDisplay="block"
        selectLongPressDelay={0}
        selectMinDistance={0}
      />

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>{editingEvent ? "Edit Reservation" : "New Reservation"}</h2>
            <input
              type="date"
              value={selectedRange.start}
              onChange={(e) =>
                setSelectedRange({ ...selectedRange, start: e.target.value })
              }
            />
            <input
              type="date"
              value={selectedRange.end}
              onChange={(e) =>
                setSelectedRange({ ...selectedRange, end: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="Your name"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
            />
            <div className="modal-buttons">
              <button onClick={handleSave}>
                {editingEvent ? "Update" : "Reserve"}
              </button>
              {editingEvent && (
                <button
                  onClick={handleDelete}
                  style={{ backgroundColor: "#ef4444", color: "white" }}
                >
                  Delete
                </button>
              )}
              <button onClick={handleCancel}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
