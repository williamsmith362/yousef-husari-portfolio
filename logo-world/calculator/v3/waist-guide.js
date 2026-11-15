import {formatLength} from './model.js';
export function waistConstructionGuide(unit='in',fractions=false){
 const f=v=>formatLength(v,unit,fractions);
 const defs=id=>`<defs><marker id="${id}" viewBox="0 0 8 8" refX="4" refY="4" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M8 4 0 0 0 8Z" fill="currentColor"/></marker></defs>`;
 return `<div class="waist-guide-grid"><section><h3>Front · shallow dip</h3><svg viewBox="0 0 360 270" role="img" aria-label="A shallow straight waistline from the side seam to a front point ${f(.5)} inward and ${f(.5)} down.">${defs('frontGuideArrow')}
 <path class="guide-original" d="M15 230 V100 H292 V230 M277 100 V115 H292"/>
 <path class="guide-finished" d="M15 230 C15 174 25 124 40 100 L277 115 Q277 180 290 230"/>
 <g class="guide-dimension" marker-start="url(#frontGuideArrow)" marker-end="url(#frontGuideArrow)"><path d="M292 66 H277"/><path d="M318 100 V115"/></g>
 <text x="270" y="50" text-anchor="middle">${f(.5)} inward</text><text x="310" y="162" text-anchor="end">${f(.5)} down</text><path class="guide-leader" d="M300 147 L318 120"/>
 <circle class="guide-start" cx="292" cy="100" r="3"/><text class="guide-note" x="296" y="88" text-anchor="middle">Start corner</text>
 <circle class="guide-point" cx="277" cy="115" r="4"/><text class="guide-label" x="230" y="204" text-anchor="middle">New waist point</text><path class="guide-leader" d="M242 189 L273 122"/>
 <circle class="guide-side-point" cx="40" cy="100" r="3"/><text class="guide-note" x="70" y="78">Side waist</text><path class="guide-leader" d="M67 82 L43 97"/><text class="guide-note" x="35" y="252" text-anchor="middle">Side seam</text>
 </svg><p>Use the lower inward corner of the <strong>${f(.5)} box</strong>. Draw a straight, shallow line from this point to the side-waist point.</p></section>
 <section><h3>Back · gentle raise</h3><svg viewBox="0 0 360 270" role="img" aria-label="A gently raised straight waistline from the side seam to a back point ${f(.75)} inward and ${f(.375)} up.">${defs('backGuideArrow')}
 <path class="guide-original" d="M55 230 V115 H340 V230 M55 103.75 H77.5 V115"/>
 <path class="guide-finished" d="M340 230 C340 178 329 138 315 115 L77.5 103.75 Q75 170 60 230"/>
 <g class="guide-dimension" marker-start="url(#backGuideArrow)" marker-end="url(#backGuideArrow)"><path d="M55 66 H77.5"/><path d="M30 115 V103.75"/></g>
 <text x="75" y="50" text-anchor="middle">${f(.75)} inward</text><text x="35" y="160">${f(.375)} up</text><path class="guide-leader" d="M38 145 L30 121"/>
 <circle class="guide-start" cx="55" cy="115" r="3"/><text class="guide-note" x="70" y="88" text-anchor="middle">Start corner</text>
 <circle class="guide-point" cx="77.5" cy="103.75" r="4"/><text class="guide-label" x="180" y="204" text-anchor="middle">New waist point</text><path class="guide-leader" d="M170 189 L82 111"/>
 <circle class="guide-side-point" cx="315" cy="115" r="3"/><text class="guide-note" x="230" y="78">Side waist</text><path class="guide-leader" d="M280 82 L312 112"/><text class="guide-note" x="320" y="252" text-anchor="middle">Side seam</text>
 </svg><p>Mark <strong>${f(.75)} inward</strong> and <strong>${f(.375)} up</strong>. Join the new point straight to the side-waist point.</p></section></div><div class="guide-key"><span>Dashed grey: original corner &amp; box</span><span>Solid: shaped waist &amp; rise</span><span>Red dot: new waist point</span></div>`;
}
