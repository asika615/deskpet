/** Visible shoulder sampled from original.png at its original registration.
 * The path only separates the existing skin from hair, bodice and fixed armor.
 * It draws no new skin pixels, highlights or ink. Hair/collar/armor retain their
 * own foreground masks. The shared sleeve-root field handles the buried join.
 */
export const REFERENCE_SHOULDER_BOX = Object.freeze([580,688,674,788]);

// The lining bridges only the space behind the existing plate and sleeve lip.
// It carries no skin or outline and does not change the fixed armor silhouette.
export const SHOULDER_LINING_BOX = Object.freeze([568,728,675,795]);
export function makeShoulderLining(make) {
  const [x0,y0,x1,y1]=SHOULDER_LINING_BOX;
  const canvas=make(x1-x0,y1-y0),g=canvas.getContext('2d');
  g.translate(-x0,-y0);g.fillStyle='#211a19';
  g.beginPath();g.moveTo(570,732);
  g.bezierCurveTo(580,733,587,735,593,737);g.lineTo(641,761);
  g.lineTo(644,776);g.lineTo(635,768);
  g.bezierCurveTo(620,758,600,755,585,751);g.lineTo(570,747);
  g.closePath();g.fill();return{canvas,sourceBox:SHOULDER_LINING_BOX};
}
export function makeReferenceShoulder(source, make) {
  const [x0,y0,x1,y1] = REFERENCE_SHOULDER_BOX;
  const canvas = make(x1-x0,y1-y0), g = canvas.getContext('2d');
  g.save();g.translate(-x0,-y0);
  // Keep the original hair-side antialias and ink at the buried contact, too.
  // The distal point lies behind the unchanged plate. No replacement ink seam.
  // Include the full original dark hair/shoulder contact, not a detached
  // skin-only cutout. Head/collar are in front, so their source pixels overlap.
  g.beginPath();g.moveTo(580,688);g.lineTo(674,688);
  g.lineTo(674,742);g.lineTo(643,773);
  g.lineTo(640,763);g.lineTo(635,758);
  g.lineTo(638,746);g.lineTo(631,755);g.lineTo(580,733);
  g.closePath();g.clip();
  g.drawImage(source,0,0);g.restore();
  return {canvas,sourceBox:REFERENCE_SHOULDER_BOX};
}
