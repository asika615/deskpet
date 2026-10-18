/** Buried sleeve fabric, never skin or armor. Uses the existing sleeve material.
 * The root shares the sleeve's skinning field; the elbow gusset shares its FK.
 * Neither is an external shoulder cap and neither has a replacement ink edge.
 */
export function makeArmUnderlap(sleeve,make){
 const material=make(24,24),mg=material.getContext('2d');
 // Unmarked dark fabric inside tex/waveUpper.png, away from red trim and ink.
 mg.drawImage(sleeve,208,80,20,20,0,0,24,24);
 const rootBox=[574,738,674,846],root=make(100,108),g=root.getContext('2d');
 g.translate(-574,-738);g.beginPath();
 g.moveTo(614,742);g.bezierCurveTo(627,740,647,746,660,758);
 g.lineTo(668,788);g.lineTo(628,841);g.lineTo(577,811);
 g.bezierCurveTo(585,789,597,762,614,742);g.closePath();g.clip();
 g.drawImage(material,574,738,100,108);
 const elbowBox=[516,827,604,915],elbow=make(88,88),e=elbow.getContext('2d');
 e.beginPath();e.arc(44,44,31,0,Math.PI*2);e.clip();e.drawImage(material,0,0,88,88);
 return {root,rootBox,elbow,elbowBox};
}
