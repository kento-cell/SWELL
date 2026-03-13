/** @type {const} */
const themeColors = {
  // Famicom primary colors (NES palette inspired)
  primary:    { light: '#E74C3C', dark: '#E74C3C' },      // Famicom Red
  background: { light: '#1A1A2E', dark: '#1A1A2E' },      // Deep black
  surface:    { light: '#2D2D44', dark: '#2D2D44' },      // Dark gray-blue
  foreground: { light: '#F0F0F0', dark: '#F0F0F0' },      // Off-white
  muted:      { light: '#8B8B8B', dark: '#8B8B8B' },      // Medium gray
  border:     { light: '#3D3D5C', dark: '#3D3D5C' },      // Dark border
  success:    { light: '#27AE60', dark: '#27AE60' },      // Famicom Green
  warning:    { light: '#F39C12', dark: '#F39C12' },      // Famicom Yellow
  error:      { light: '#C0392B', dark: '#C0392B' },      // Dark Red
  // Famicom wave sentiment colors (8-bit palette)
  waveBlue:   { light: '#3498DB', dark: '#3498DB' },      // Sky Blue (neutral)
  waveGreen:  { light: '#27AE60', dark: '#27AE60' },      // NES Green (positive)
  waveYellow: { light: '#F39C12', dark: '#F39C12' },      // NES Yellow (mixed)
  waveRed:    { light: '#E74C3C', dark: '#E74C3C' },      // NES Red (negative)
  // Famicom accent colors
  premium:    { light: '#F39C12', dark: '#F39C12' },      // Gold/Yellow
  // Additional Famicom palette colors
  famiBrown:  { light: '#8B4513', dark: '#8B4513' },      // Brown (Mario brick)
  famiPurple: { light: '#9B59B6', dark: '#9B59B6' },      // Purple (Goomba)
};

module.exports = { themeColors };
