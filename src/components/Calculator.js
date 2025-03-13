import React, { useState } from 'react';

const Calculator = () => {
  const [criticalRatePoints, setCriticalRatePoints] = useState('');
  const [criticalDamagePoints, setCriticalDamagePoints] = useState('');
  const [accuracyPoints, setAccuracyPoints] = useState('');
  const [debuffResistancePoints, setDebuffResistancePoints] = useState('');

  const calculateCriticalRate = (points) => {
    if (!points || isNaN(points)) return null;
    const numPoints = Number(points);
    const result = (96.98979 * numPoints) / (1124.069 + numPoints);
    console.log(`Critical Rate Calculation for ${numPoints} points:`, {
      numerator: 96.98979 * numPoints,
      denominator: 1124.069 + numPoints,
      result: result
    });
    return result.toFixed(2);
  };

  const calculateCriticalDamage = (points) => {
    if (!points || isNaN(points)) return null;
    const numPoints = Number(points);
    const result = ((290.8 * numPoints) / (2102.36 + numPoints)) + 125;
    console.log(`Critical Damage Calculation for ${numPoints} points:`, {
      numerator: 290.8 * numPoints,
      denominator: 2102.36 + numPoints,
      baseResult: (290.8 * numPoints) / (2102.36 + numPoints),
      finalResult: result
    });
    return result.toFixed(2);
  };

  const calculateAccuracy = (points) => {
    if (!points || isNaN(points)) return null;
    const numPoints = Number(points);
    const result = ((96.16 * numPoints) / (820.5 + numPoints)) + 85;
    console.log(`Accuracy Calculation for ${numPoints} points:`, {
      numerator: 96.16 * numPoints,
      denominator: 820.5 + numPoints,
      baseResult: (96.16 * numPoints) / (820.5 + numPoints),
      finalResult: result
    });
    return result.toFixed(2);
  };

  const calculateDebuffResistance = (points) => {
    if (!points || isNaN(points)) return null;
    const numPoints = Number(points);
    const result = (100.0794 * numPoints) / (366.3908 + numPoints);
    console.log(`Debuff Resistance Calculation for ${numPoints} points:`, {
      numerator: 100.0794 * numPoints,
      denominator: 366.3908 + numPoints,
      result: result
    });
    return result.toFixed(2);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-200 mb-6 text-center">Blade & Soul Stat Calculator</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Critical Rate Panel */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 p-6">
          <h3 className="text-xl font-semibold text-slate-200 mb-4">Critical Rate</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Points
              </label>
              <input
                type="number"
                value={criticalRatePoints}
                onChange={(e) => setCriticalRatePoints(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-600"
                placeholder="Enter points"
              />
            </div>
            <p className="text-sm text-slate-400">Formula: (96.98979 × points) / (1124.069 + points)</p>
            <div className="text-2xl font-bold text-sky-100">
              {calculateCriticalRate(criticalRatePoints) || '0'}%
            </div>
          </div>
        </div>

        {/* Critical Damage Panel */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 p-6">
          <h3 className="text-xl font-semibold text-slate-200 mb-4">Critical Damage</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Points
              </label>
              <input
                type="number"
                value={criticalDamagePoints}
                onChange={(e) => setCriticalDamagePoints(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-600"
                placeholder="Enter points"
              />
            </div>
            <p className="text-sm text-slate-400">Formula: (290.8 × points) / (2102.36 + points) + 125</p>
            <div className="text-2xl font-bold text-violet-100">
              {calculateCriticalDamage(criticalDamagePoints) || '0'}%
            </div>
          </div>
        </div>

        {/* Accuracy Panel */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 p-6">
          <h3 className="text-xl font-semibold text-slate-200 mb-4">Accuracy</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Points
              </label>
              <input
                type="number"
                value={accuracyPoints}
                onChange={(e) => setAccuracyPoints(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-600"
                placeholder="Enter points"
              />
            </div>
            <p className="text-sm text-slate-400">Formula: (96.16 × points) / (820.5 + points) + 85</p>
            <div className="text-2xl font-bold text-emerald-100">
              {calculateAccuracy(accuracyPoints) || '0'}%
            </div>
          </div>
        </div>

        {/* Debuff Resistance Panel */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 p-6">
          <h3 className="text-xl font-semibold text-slate-200 mb-4">Debuff Resistance</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Points
              </label>
              <input
                type="number"
                value={debuffResistancePoints}
                onChange={(e) => setDebuffResistancePoints(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-600"
                placeholder="Enter points"
              />
            </div>
            <p className="text-sm text-slate-400">Formula: (100.0794 × points) / (366.3908 + points)</p>
            <div className="text-2xl font-bold text-rose-100">
              {calculateDebuffResistance(debuffResistancePoints) || '0'}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calculator; 