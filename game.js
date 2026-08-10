const MODES = ['classic', 'precision', 'speed', 'reaction', 'tracking']

// giving each mode distinct colors that will be used for targets, glow, and UI highlights
// matches the themes in :root in stylles.css
const MODE_COLORS = {
    classic: {primary: '#e7b73c', secondary: '#bd8f1f', glow: 'rgba(231, 183,60,0.31)'},
    precision: {primary: '#e12323', secondary: '#ab2d26', glow: 'rgba(249, 34, 34, 0.27)'},
    speed: {primary: '#e8662c', secondary: '#c1491a', glow: 'rgba(232, 102, 44, 0.32)'},
    reaction: {primary: '#c26fc4', secondary: '#9a4fa0', glow: 'rgba(194, 111, 196, 0.28)'},
    tracking: {primary: '#2db89f', secondary: '#1d8f79', glow: 'rgba(45, 184, 159, 0.28)'}
};

const MODE_CONFIG = {
    classic: {duration: 60, targetRadius: 35, maxTargets:1, lifetime: 0, baseScore: 100, spawnDelay: 0.3, targetTypes: ['static']},
    precision: {duration: 60, targetRadius: 18, maxTargets: 1, lifetime: 0, baseScore: 250, spawnDelay: 0.4, targetTypes: ['static']},
    speed: {duration: 30, targetRadius: 30, maxTargets: 3, lifetime: 1.5, baseScore: 75, spawnDelay: 0.15, targetTypes: ['static']},
    reaction: {duration: 0, targetRadius: 35, maxTargets: 1, lifetime: 0, baseScore: 0, spawnDelay: 0, targetTypes: ['static']},
    tracking: {duration: 0, targetRadius: 30, maxTargets: 2, lifetime: 3.5, baseScore: 150, spawnDelay: 0.6, targetTypes: ['strafe', 'float', 'follow']}
}