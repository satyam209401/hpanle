import React, { useState, useEffect, useRef } from 'react';
import { Terminal as TerminalIcon, Play, Trash2, Copy, Check, CornerDownLeft } from 'lucide-react';
import { socket } from '../services/api';

export default function TerminalView() {
  const [output, setOutput] = useState([
    'Connected to hPanel VPS Secure Terminal Session.',
    'Type commands below or click quick action buttons.\n'
  ]);
  const [inputCommand, setInputCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [copied, setCopied] = useState(false);
  const terminalEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleTerminalData = (data) => {
      setOutput(prev => [...prev, data]);
    };

    socket.on('terminal:data', handleTerminalData);

    return () => {
      socket.off('terminal:data', handleTerminalData);
    };
  }, []);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [output]);

  const handleSendCommand = (cmdToSend) => {
    const cmd = (cmdToSend !== undefined ? cmdToSend : inputCommand).trim();
    if (!cmd) return;

    // Echo command in terminal
    setOutput(prev => [...prev, `\r\nroot@vps:~# ${cmd}\r\n`]);
    
    // Send to backend via Socket.io
    socket.emit('terminal:write', `${cmd}\n`);

    setCommandHistory(prev => [cmd, ...prev]);
    setHistoryIndex(-1);
    setInputCommand('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSendCommand();
    } else if (e.key === 'ArrowUp') {
      if (historyIndex + 1 < commandHistory.length) {
        const nextIdx = historyIndex + 1;
        setHistoryIndex(nextIdx);
        setInputCommand(commandHistory[nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      if (historyIndex - 1 >= 0) {
        const prevIdx = historyIndex - 1;
        setHistoryIndex(prevIdx);
        setInputCommand(commandHistory[prevIdx]);
      } else {
        setHistoryIndex(-1);
        setInputCommand('');
      }
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output.join(''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const quickCommands = [
    { label: 'Disk Space', cmd: 'df -h' },
    { label: 'Memory Info', cmd: 'free -m' },
    { label: 'Uptime', cmd: 'uptime' },
    { label: 'Nginx Status', cmd: 'systemctl status nginx --no-pager' },
    { label: 'Docker Containers', cmd: 'docker ps' },
    { label: 'PM2 List', cmd: 'pm2 status' },
    { label: 'Active Ports', cmd: 'netstat -tuln' }
  ];

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto flex flex-col h-[calc(100vh-4rem)]">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <TerminalIcon className="w-6 h-6 text-indigo-400" />
            <span>Web SSH Terminal</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Direct root command execution on your VPS without needing an external SSH client.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            onClick={() => setOutput([])}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Quick Command Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0 scrollbar-none">
        <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider shrink-0">
          Quick:
        </span>
        {quickCommands.map((qc, idx) => (
          <button
            key={idx}
            onClick={() => handleSendCommand(qc.cmd)}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-indigo-600/30 border border-slate-700 hover:border-indigo-500/40 text-slate-300 hover:text-indigo-200 text-xs font-mono transition-colors shrink-0"
          >
            {qc.label}
          </button>
        ))}
      </div>

      {/* Terminal Container */}
      <div className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        {/* Terminal Titlebar */}
        <div className="h-10 bg-slate-900 border-b border-slate-800/80 px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500/80"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
            <span className="text-xs font-mono text-slate-400 ml-2">bash / shell — root@vps</span>
          </div>
          <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            pty session live
          </div>
        </div>

        {/* Terminal Screen */}
        <div 
          onClick={() => inputRef.current?.focus()}
          className="flex-1 p-5 overflow-y-auto font-mono text-xs leading-relaxed text-slate-200 cursor-text select-text"
        >
          {output.map((line, idx) => (
            <div key={idx} className="whitespace-pre-wrap break-all">{line}</div>
          ))}
          <div ref={terminalEndRef} />
        </div>

        {/* Command Input Bar */}
        <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2 shrink-0">
          <span className="text-indigo-400 font-mono text-xs font-bold pl-2 select-none">root@vps:~#</span>
          <input
            ref={inputRef}
            type="text"
            value={inputCommand}
            onChange={(e) => setInputCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type Linux command here..."
            className="flex-1 bg-transparent border-none text-white font-mono text-xs focus:outline-none placeholder-slate-600"
            autoFocus
          />
          <button
            onClick={() => handleSendCommand()}
            className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
            title="Execute"
          >
            <CornerDownLeft className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
