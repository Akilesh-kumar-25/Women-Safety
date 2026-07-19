import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { COUNTRIES } from './countries';

interface Contact {
  id: string;
  name: string;
  phone: string;
  relation: string;
}

const SunIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"></circle>
    <line x1="12" y1="1" x2="12" y2="3"></line>
    <line x1="12" y1="21" x2="12" y2="23"></line>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
    <line x1="1" y1="12" x2="3" y2="12"></line>
    <line x1="21" y1="12" x2="23" y2="12"></line>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
  </svg>
);

const MoonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
  </svg>
);

const Dashboard: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRelation, setNewRelation] = useState('Friends & Family');
  const [loading, setLoading] = useState(false);
  
  const [newCountryCode, setNewCountryCode] = useState('+91');

  // Theme State
  const [theme, setTheme] = useState(localStorage.getItem('dashboardTheme') || 'light');
  
  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCountryCode, setEditCountryCode] = useState('+91');
  const [editRelation, setEditRelation] = useState('Friends & Family');
  
  const navigate = useNavigate();

  // AI Voice State
  const [status, setStatus] = useState("Initializing Voice AI...");
  const [helpCount, setHelpCount] = useState(0);
  const recognitionRef = useRef<any>(null);

  const [permissionsGranted, setPermissionsGranted] = useState(false);

  const uid = localStorage.getItem('userUid');

  useEffect(() => {
    if (!uid) {
      navigate('/login');
      return;
    }
    fetchContacts();
    
    // Check if permissions are already granted
    const checkPerms = async () => {
      let allGranted = false;
      try {
        const cam = await navigator.permissions.query({ name: 'camera' as any });
        const mic = await navigator.permissions.query({ name: 'microphone' as any });
        const loc = await navigator.permissions.query({ name: 'geolocation' as any });
        if (cam.state === 'granted' && mic.state === 'granted' && loc.state === 'granted') {
          allGranted = true;
          setPermissionsGranted(true);
        }
      } catch (e) {
        // Fallback for browsers that don't support permission queries
      }

      // Automatically pop up the permission requests if they haven't been granted yet
      if (!allGranted) {
        requestPermissions();
      }
    };
    checkPerms();
  }, [uid]);

  const requestPermissions = async () => {
    let camGranted = false;
    let micGranted = false;

    // 1. Request Camera (Video)
    try {
      const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoStream.getTracks().forEach(track => track.stop());
      camGranted = true;
    } catch (err) {
      console.warn("Video permission denied or unavailable.");
    }
    
    // 2. Request Microphone (Voice)
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStream.getTracks().forEach(track => track.stop());
      micGranted = true;
    } catch (err) {
      console.warn("Audio permission denied or unavailable.");
    }
    
    // 3. Request Location and Strict Check
    let locGranted = false;
    try {
      const locStatus = await navigator.permissions.query({ name: 'geolocation' as any });
      if (locStatus.state === 'granted') locGranted = true;
    } catch (e) {}

    const checkAndUnlock = () => {
      // ONLY unlock if absolutely all 3 permissions are granted!
      if (camGranted && micGranted) {
        setPermissionsGranted(true);
      }
    };

    if (locGranted) {
      checkAndUnlock();
    } else {
      // Trigger prompt
      navigator.geolocation.getCurrentPosition(
        checkAndUnlock, // Success fallback if polling fails
        () => {}, // Denied - remain locked!
        { maximumAge: 10000, timeout: 5000, enableHighAccuracy: false }
      );
      
      // Poll aggressively to bypass slow GPS lock, but STILL enforce the check
      const interval = setInterval(async () => {
        try {
          const loc = await navigator.permissions.query({ name: 'geolocation' as any });
          if (loc.state === 'granted') {
            clearInterval(interval);
            checkAndUnlock();
          } else if (loc.state === 'denied') {
            clearInterval(interval);
            // Remain locked!
          }
        } catch (e) {
          clearInterval(interval);
        }
      }, 500);
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('dashboardTheme', nextTheme);
  };

  const fetchContacts = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/contacts/${uid}`);
      const data = await res.json();
      if (res.ok) {
        setContacts(data.contacts || []);
      }
    } catch (err) {
      console.error("Failed to fetch contacts", err);
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPhone) return;
    
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid,
          name: newName,
          phone: newCountryCode + newPhone,
          relation: newRelation
        })
      });
      if (res.ok) {
        setNewName('');
        setNewPhone('');
        setNewCountryCode('+91');
        fetchContacts(); // refresh list
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (c: Contact) => {
    setEditingId(c.id);
    setEditName(c.name);
    
    // Split phone into country code and 10-digit number
    let code = '+91';
    let num = c.phone;
    if (c.phone.startsWith('+')) {
      const match = c.phone.match(/^(\+\d{1,4})(\d{10})$/);
      if (match) {
        code = match[1];
        num = match[2];
      } else {
        // Fallback for older non-standard formats
        num = c.phone.replace(/\D/g, '').slice(-10);
      }
    } else {
      // Legacy numbers without +
      num = c.phone;
    }
    
    setEditCountryCode(code);
    setEditPhone(num);
    setEditRelation(c.relation);
  };

  const handleEditContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/contacts/${uid}/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          phone: editCountryCode + editPhone,
          relation: editRelation
        })
      });
      if (res.ok) {
        setEditingId(null);
        fetchContacts(); // refresh list
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- AI VOICE LOGIC ---
  const handleSendHelp = useCallback(async () => {
    try {
      setStatus("EMERGENCY TRIGGERED! Capturing 30s video...");
      
      const position: any = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      const { latitude, longitude } = position.coords;

      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.start();
      
      await new Promise(resolve => setTimeout(resolve, 30000));
      
      recorder.stop();
      stream.getTracks().forEach(track => track.stop());

      const videoBlob = await new Promise<Blob>(resolve => {
          recorder.onstop = () => resolve(new Blob(chunks, { type: 'video/webm' }));
      });
      
      setStatus("Sending alert to backend...");
      
      const formData = new FormData();
      formData.append('latitude', String(latitude));
      formData.append('longitude', String(longitude));
      formData.append('message', "HELP NEEDED!");
      formData.append('video', videoBlob, 'emergency.webm');
      
      // Only send to user's saved contacts
      const allPhoneNumbers = contacts.map(c => c.phone);
      formData.append('recipients', JSON.stringify(allPhoneNumbers));
      
      const response = await fetch('http://localhost:8000/api/send-alert', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setStatus("Alert Sent Successfully!");
      } else {
        setStatus("Failed to send alert to backend.");
      }

    } catch (err: any) {
        setStatus(`Error: ${err.message}`);
    }
  }, [contacts]);

  useEffect(() => {
    if (!permissionsGranted) return; // Wait until permissions are granted!

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setStatus("Voice AI not supported in this browser.");
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true; // Use true for instant, real-time recognition without waiting for pauses
    recognition.lang = 'en-US';
    
    recognition.onresult = (event: any) => {
      let fullTranscript = "";
      for (let i = 0; i < event.results.length; ++i) {
        fullTranscript += event.results[i][0].transcript.toLowerCase() + " ";
      }
      const occurrences = (fullTranscript.match(/help/g) || []).length;
      
      setHelpCount(prev => Math.max(prev, occurrences));
    };
    recognition.onend = () => { 
      try { recognition.start(); } catch (e) {} 
    };
    
    recognitionRef.current = recognition;
    
    try {
      recognition.start();
      setStatus("Voice AI active in background. Shout 'help' 2 times to trigger SOS.");
    } catch (e) {
      console.log(e);
    }

    return () => {
      recognition.onend = null;
      recognition.stop();
    };
  }, [permissionsGranted]);

  useEffect(() => {
    if (helpCount >= 2) {
      handleSendHelp();
    }
  }, [helpCount, handleSendHelp]);
  
  const handleLogout = () => {
    localStorage.removeItem('userUid');
    localStorage.removeItem('userName');
    navigate('/login');
  };

  const displayUser = localStorage.getItem('userName') || 'User';
  // Use first letter for profile icon
  const profileInitial = displayUser.charAt(0).toUpperCase();

  return (
    <div className="dashboard-page-wrapper" data-theme={theme}>
      <div className="dash-container">
        
        {/* Header with Profile and Theme Toggle */}
        <div className="dash-header-bar">
          <h1>Welcome Back, {displayUser}</h1>
          <div className="dash-profile-section">
            <button onClick={toggleTheme} className="theme-toggle-btn" title="Toggle Theme">
              {theme === 'light' ? <MoonIcon /> : <SunIcon />}
            </button>
            <div className="profile-icon">{profileInitial}</div>
            <button onClick={handleLogout} className="dash-btn dash-btn-danger" style={{padding: '0.5rem 1rem', fontSize: '0.9rem'}}>Logout</button>
          </div>
        </div>

        {!permissionsGranted ? (
          <div className="dash-card" style={{textAlign: 'center', padding: '4rem 2rem', marginTop: '2rem'}}>
            <h2 style={{marginBottom: '1rem'}}>Critical Permissions Required</h2>
            <p style={{marginBottom: '2rem', fontSize: '1.1rem', opacity: 0.9}}>
              To ensure your safety, this app requires upfront access to your Camera, Microphone, and Location. 
              This ensures that during an emergency, the SOS protocol can instantly capture and send your surroundings without prompting you.
            </p>
            <button onClick={requestPermissions} className="dash-btn dash-btn-primary" style={{fontSize: '1.2rem', padding: '1rem 2rem'}}>
              Grant Permissions to Continue
            </button>
          </div>
        ) : (
          <>
            {/* Center Emergency Button */}
            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '3rem', marginTop: '1rem'}}>
              <button onClick={handleSendHelp} className="dash-btn dash-btn-danger" style={{width: '250px', height: '80px', fontSize: '1.5rem', borderRadius: '40px', boxShadow: '0 8px 32px rgba(239, 68, 68, 0.4)', fontWeight: 800, letterSpacing: '2px'}}>
                SOS / HELP
              </button>
              <div className="ai-status pulse" style={{marginTop: '1.5rem', fontSize: '1rem', fontWeight: 600, opacity: 0.8, textAlign: 'center'}}>
                <strong>AI Status:</strong> {status} <span style={{color: 'var(--dash-danger)'}}>(Heard "help": {helpCount}/2)</span>
              </div>
            </div>

        <div className="dash-card" style={{marginBottom: '2rem'}}>
          <h3 style={{marginBottom: '1rem'}}>Add New Contact</h3>
          <form onSubmit={handleAddContact} className="dash-form-grid">
            <input type="text" className="dash-input" placeholder="Name" value={newName} onChange={e=>setNewName(e.target.value)} required />
            <div style={{display: 'flex', gap: '0.5rem'}}>
              <select className="dash-input" style={{width: '120px', padding: '0.5rem'}} value={newCountryCode} onChange={e=>setNewCountryCode(e.target.value)}>
                {COUNTRIES.map(c => (
                  <option key={c.code + c.name} value={c.code}>{c.flag} {c.name} ({c.code})</option>
                ))}
              </select>
              <input type="text" className="dash-input" style={{flex: 1}} placeholder="Phone (10 digits)" value={newPhone} onChange={e=>{
                const val = e.target.value.replace(/\D/g, '');
                if (val.length <= 10) setNewPhone(val);
              }} pattern="\d{10}" minLength={10} maxLength={10} title="Phone number must be exactly 10 digits" required />
            </div>
            <select className="dash-input" value={newRelation} onChange={e=>setNewRelation(e.target.value)}>
              <option value="Friends & Family">Friends & Family</option>
              <option value="Emergency">Emergency</option>
            </select>
            <button type="submit" className="dash-btn dash-btn-primary" disabled={loading}>Add Contact</button>
          </form>
        </div>

        <h3>Emergency Contacts</h3>
        <div className="dash-contact-list">
          <div className="dash-card dash-contact-card">
            <div>
              <span className="dash-badge dash-badge-emergency">Emergency</span>
              <div className="dash-contact-name">Police</div>
              <div className="dash-contact-phone">XXXXXXXXXX</div>
            </div>
          </div>
          
          {contacts.map(c => (
            <div className="dash-card dash-contact-card" key={c.id}>
              {editingId === c.id ? (
                <form onSubmit={handleEditContact} style={{display: 'flex', flexDirection: 'column', gap: '0.75rem', height: '100%'}}>
                  <div style={{fontWeight: 600, marginBottom: '0.25rem'}}>Editing Contact</div>
                  <input type="text" className="dash-input" placeholder="Name" value={editName} onChange={e=>setEditName(e.target.value)} required />
                  <div style={{display: 'flex', gap: '0.5rem'}}>
                    <select className="dash-input" style={{width: '120px', padding: '0.5rem'}} value={editCountryCode} onChange={e=>setEditCountryCode(e.target.value)}>
                      {COUNTRIES.map(c => (
                        <option key={c.code + c.name} value={c.code}>{c.flag} {c.name} ({c.code})</option>
                      ))}
                    </select>
                    <input type="text" className="dash-input" style={{flex: 1}} placeholder="Phone (10 digits)" value={editPhone} onChange={e=>{
                      const val = e.target.value.replace(/\D/g, '');
                      if (val.length <= 10) setEditPhone(val);
                    }} pattern="\d{10}" minLength={10} maxLength={10} title="Phone number must be exactly 10 digits" required />
                  </div>
                  <select className="dash-input" value={editRelation} onChange={e=>setEditRelation(e.target.value)}>
                    <option value="Friends & Family">Friends & Family</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                  <div style={{display: 'flex', gap: '0.5rem', marginTop: 'auto'}}>
                    <button type="submit" className="dash-btn dash-btn-primary" style={{flex: 1, padding: '0.6rem'}} disabled={loading}>Save</button>
                    <button type="button" className="dash-btn" style={{flex: 1, padding: '0.6rem', background: 'rgba(255,255,255,0.1)', border: '1px solid var(--dash-card-border)', color: 'var(--dash-text)'}} onClick={() => setEditingId(null)}>Cancel</button>
                  </div>
                </form>
              ) : (
                <>
                  <div>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                      <span className={`dash-badge ${c.relation === 'Emergency' ? 'dash-badge-emergency' : 'dash-badge-family'}`}>{c.relation}</span>
                      <button onClick={() => startEditing(c)} style={{background: 'rgba(255,255,255,0.1)', border: '1px solid var(--dash-card-border)', color: 'var(--dash-text)', cursor: 'pointer', fontWeight: 600, padding: '0.25rem 0.75rem', borderRadius: '6px', fontSize: '0.85rem', transition: 'all 0.2s'}}>Edit</button>
                    </div>
                    <div className="dash-contact-name" style={{marginTop: '0.5rem'}}>{c.name}</div>
                    <a href={`tel:${c.phone}`} className="dash-contact-phone" style={{display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'inherit'}}>
                      <span style={{fontSize: '1.2rem'}}>📞</span> {c.phone}
                    </a>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
        
        </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
