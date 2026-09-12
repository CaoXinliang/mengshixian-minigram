// Keep the approved bar dimensions in one place for both JS viewport math and WXSS.
const FIXED_BAR_HEIGHT = 64;
const CONTENT_END_GAP = 12;
const fixedLayerStyle = [
  `--fixed-bar-height:${FIXED_BAR_HEIGHT}px`,
  `--fixed-one-space:${FIXED_BAR_HEIGHT + CONTENT_END_GAP}px`,
  `--fixed-two-space:${FIXED_BAR_HEIGHT * 2 + CONTENT_END_GAP}px`
].join(';');

module.exports = { FIXED_BAR_HEIGHT, CONTENT_END_GAP, fixedLayerStyle };
