import Phone from "./phone";
import { ZIGZAG } from "../_lib/features";

// Zigzag feature rows: image alternates side, text on the other. Each row is a
// self-contained unit (Gestalt). Benefit-led heading wins the scan (layer-cake).
// Responsive: single centered column on phones; 2-column zigzag from md up, with
// odd rows flipping the image to the right via grid column order.
export default function FeatureRows() {
  return (
    <section
      id="features"
      className="mx-auto flex max-w-content scroll-mt-24 flex-col gap-rows px-gutter py-section"
    >
      {ZIGZAG.map((f, i) => {
        const flip = i % 2 === 1; // odd rows put the phone on the right
        return (
          <div
            key={f.img}
            className="grid grid-cols-1 items-center gap-10 text-center md:grid-cols-2 md:gap-12 md:text-left"
          >
            <div className={`flex justify-center ${flip ? "md:order-2" : ""}`}>
              <Phone src={f.img} alt={f.alt} />
            </div>
            <div className={flip ? "md:order-1" : ""}>
              <span className="mb-3 inline-block text-eyebrow font-bold uppercase tracking-[0.1em] text-green">
                {f.label}
              </span>
              <h2 className="text-h3 font-bold">{f.title}</h2>
              <p className="mx-auto mt-4 max-w-copy text-body text-muted md:mx-0">
                {f.body}
              </p>
            </div>
          </div>
        );
      })}
    </section>
  );
}
