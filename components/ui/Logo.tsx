interface LogoProps {
  size?: "sm" | "md" | "lg";
}

export default function Logo({ size = "md" }: LogoProps) {
  const bigText = size === "sm" ? "text-4xl" : size === "lg" ? "text-6xl" : "text-5xl";
  const smallText = size === "sm" ? "text-[6px]" : "text-[7px]";
  const medText = size === "sm" ? "text-[10px]" : "text-xs";

  return (
    <div className="inline-flex items-start gap-1 select-none">
      {/* Big "20" — Poppins 700-800 */}
      <span className={`font-heading ${bigText} font-extrabold text-black leading-none`}>
        20
      </span>

      {/* Right side text stack */}
      <div className="flex flex-col justify-center leading-none pt-1 gap-[2px]">
        <span className={`font-body ${smallText} font-normal tracking-[0.15em] text-black uppercase`}>
          Aniversario
        </span>
        <span className={`font-heading ${medText} font-extrabold text-black uppercase leading-tight`}>
          Speakers
        </span>
        <span className={`font-heading ${medText} font-extrabold text-black uppercase leading-tight`}>
          México<sup className="text-[6px] ml-[1px]">®</sup>
        </span>
        <span className={`font-body ${smallText} font-light tracking-[0.2em] text-black uppercase`}>
          Latam
        </span>
      </div>
    </div>
  );
}
