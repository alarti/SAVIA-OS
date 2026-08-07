import React, { useState } from 'react';
import { Delete, RotateCcw, Calculator as CalcIcon } from 'lucide-react';

export default function CalculatorApp() {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [memory, setMemory] = useState<number>(0);

  const handleNum = (num: string) => {
    if (display === '0' || display === 'Error') {
      setDisplay(num);
    } else {
      setDisplay(display + num);
    }
  };

  const handleOp = (op: string) => {
    setEquation(display + ' ' + op + ' ');
    setDisplay('0');
  };

  const handleClear = () => {
    setDisplay('0');
    setEquation('');
  };

  const handleEqual = () => {
    try {
      const fullEq = equation + display;
      // Sanitize equation before eval
      const sanitized = fullEq.replace(/×/g, '*').replace(/÷/g, '/');
      // eslint-disable-next-line no-eval
      const result = eval(sanitized);
      const resStr = String(Number(result.toFixed(8)));
      setHistory(prev => [`${fullEq} = ${resStr}`, ...prev.slice(0, 9)]);
      setDisplay(resStr);
      setEquation('');
    } catch (e) {
      setDisplay('Error');
    }
  };

  const handleScience = (fn: string) => {
    try {
      const val = parseFloat(display);
      let res = 0;
      if (fn === 'sin') res = Math.sin((val * Math.PI) / 180);
      else if (fn === 'cos') res = Math.cos((val * Math.PI) / 180);
      else if (fn === 'tan') res = Math.tan((val * Math.PI) / 180);
      else if (fn === 'sqrt') res = Math.sqrt(val);
      else if (fn === 'sq') res = val * val;
      else if (fn === 'log') res = Math.log10(val);
      setDisplay(String(Number(res.toFixed(8))));
    } catch (e) {
      setDisplay('Error');
    }
  };

  return (
    <div className="w-full h-full bg-[#18181B] text-white flex flex-col p-4 font-sans select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-400">
          <CalcIcon className="w-4 h-4" />
          <span>Calculadora Científica SAVIA</span>
        </div>
        <div className="text-[10px] text-gray-400">
          Memoria: <span className="text-yellow-400 font-mono">{memory}</span>
        </div>
      </div>

      <div className="flex-1 flex gap-3">
        {/* Main Calculator Body */}
        <div className="flex-1 flex flex-col gap-2">
          {/* Display screen */}
          <div className="bg-[#09090B] border border-white/15 rounded-xl p-3 flex flex-col justify-end text-right min-h-[80px]">
            <div className="text-xs font-mono text-gray-400 h-4 truncate">{equation}</div>
            <div className="text-2xl font-mono font-bold text-white truncate">{display}</div>
          </div>

          {/* Memory buttons */}
          <div className="grid grid-cols-4 gap-1.5 text-xs font-semibold">
            <button onClick={() => setMemory(0)} className="py-1 bg-white/5 hover:bg-white/10 rounded text-gray-400">MC</button>
            <button onClick={() => setDisplay(String(memory))} className="py-1 bg-white/5 hover:bg-white/10 rounded text-gray-400">MR</button>
            <button onClick={() => setMemory(memory + parseFloat(display || '0'))} className="py-1 bg-white/5 hover:bg-white/10 rounded text-blue-400">M+</button>
            <button onClick={() => setMemory(memory - parseFloat(display || '0'))} className="py-1 bg-white/5 hover:bg-white/10 rounded text-blue-400">M-</button>
          </div>

          {/* Scientific Row */}
          <div className="grid grid-cols-6 gap-1.5 text-xs font-medium">
            <button onClick={() => handleScience('sin')} className="py-1.5 bg-blue-900/30 hover:bg-blue-800/40 rounded text-blue-300">sin</button>
            <button onClick={() => handleScience('cos')} className="py-1.5 bg-blue-900/30 hover:bg-blue-800/40 rounded text-blue-300">cos</button>
            <button onClick={() => handleScience('tan')} className="py-1.5 bg-blue-900/30 hover:bg-blue-800/40 rounded text-blue-300">tan</button>
            <button onClick={() => handleScience('sqrt')} className="py-1.5 bg-blue-900/30 hover:bg-blue-800/40 rounded text-blue-300">√</button>
            <button onClick={() => handleScience('sq')} className="py-1.5 bg-blue-900/30 hover:bg-blue-800/40 rounded text-blue-300">x²</button>
            <button onClick={() => handleScience('log')} className="py-1.5 bg-blue-900/30 hover:bg-blue-800/40 rounded text-blue-300">log</button>
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-4 gap-2 flex-1 text-sm font-semibold">
            <button onClick={handleClear} className="bg-rose-900/40 hover:bg-rose-800/60 text-rose-300 rounded-xl flex items-center justify-center">C</button>
            <button onClick={() => setDisplay(display.length > 1 ? display.slice(0, -1) : '0')} className="bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center text-gray-300">
              <Delete className="w-4 h-4" />
            </button>
            <button onClick={() => handleOp('÷')} className="bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 rounded-xl">÷</button>
            <button onClick={() => handleOp('×')} className="bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 rounded-xl">×</button>

            <button onClick={() => handleNum('7')} className="bg-white/5 hover:bg-white/15 rounded-xl">7</button>
            <button onClick={() => handleNum('8')} className="bg-white/5 hover:bg-white/15 rounded-xl">8</button>
            <button onClick={() => handleNum('9')} className="bg-white/5 hover:bg-white/15 rounded-xl">9</button>
            <button onClick={() => handleOp('-')} className="bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 rounded-xl">-</button>

            <button onClick={() => handleNum('4')} className="bg-white/5 hover:bg-white/15 rounded-xl">4</button>
            <button onClick={() => handleNum('5')} className="bg-white/5 hover:bg-white/15 rounded-xl">5</button>
            <button onClick={() => handleNum('6')} className="bg-white/5 hover:bg-white/15 rounded-xl">6</button>
            <button onClick={() => handleOp('+')} className="bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 rounded-xl">+</button>

            <button onClick={() => handleNum('1')} className="bg-white/5 hover:bg-white/15 rounded-xl">1</button>
            <button onClick={() => handleNum('2')} className="bg-white/5 hover:bg-white/15 rounded-xl">2</button>
            <button onClick={() => handleNum('3')} className="bg-white/5 hover:bg-white/15 rounded-xl">3</button>
            <button onClick={handleEqual} className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl row-span-2 flex items-center justify-center font-bold text-lg shadow-lg">
              =
            </button>

            <button onClick={() => handleNum('0')} className="col-span-2 bg-white/5 hover:bg-white/15 rounded-xl">0</button>
            <button onClick={() => !display.includes('.') && setDisplay(display + '.')} className="bg-white/5 hover:bg-white/15 rounded-xl">.</button>
          </div>
        </div>

        {/* History Sidebar */}
        <div className="w-36 bg-[#09090B] border border-white/10 rounded-xl p-2 flex flex-col">
          <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-1.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Historial</span>
            <button onClick={() => setHistory([])} className="text-gray-500 hover:text-white" title="Limpiar">
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto flex flex-col gap-1 text-[11px] font-mono text-gray-300">
            {history.length === 0 ? (
              <span className="text-[10px] text-gray-600 italic">Sin operaciones</span>
            ) : (
              history.map((item, idx) => (
                <div key={idx} className="p-1 rounded hover:bg-white/5 truncate border-b border-white/5">
                  {item}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
