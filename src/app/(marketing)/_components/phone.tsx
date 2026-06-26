import Image from "next/image";

// A cropped app phone mockup sitting on the dark bg, with a soft green glow behind
// it so the dark screenshot pops. `flip` tilts it the other way for zigzag rows.
export default function Phone({
  src,
  alt,
  priority = false,
}: {
  src: string;
  alt: string;
  priority?: boolean;
}) {
  return (
    <div className="phone-wrap">
      <div className="phone-glow" aria-hidden />
      <Image
        src={src}
        alt={alt}
        width={300}
        height={607}
        className="phone-img"
        priority={priority}
      />
    </div>
  );
}
