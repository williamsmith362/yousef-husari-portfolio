import photoBounds from "../lib/photo-bounds.json";
import type { CSSProperties } from "react";
import type { PieceImage } from "../lib/pieces";

export default function ProductPhoto({ image, ratio = 4 / 5, eager = false, detail = false }: { image: PieceImage; ratio?: number; eager?: boolean; detail?: boolean }) {
  const bounds = photoBounds[image.file as keyof typeof photoBounds];
  const productRatio = bounds.width / bounds.height;
  const width = productRatio > ratio ? 91 : 91 * productRatio / ratio;
  const height = productRatio > ratio ? 91 * ratio / productRatio : 91;
  const frameStyle = { aspectRatio: ratio } as CSSProperties;
  const cropStyle = { width: `${width}%`, height: `${height}%` } as CSSProperties;
  const imageStyle = {
    width: `${bounds.sourceWidth / bounds.width * 100}%`,
    height: `${bounds.sourceHeight / bounds.height * 100}%`,
    left: `${-bounds.x / bounds.width * 100}%`,
    top: `${-bounds.y / bounds.height * 100}%`,
  } as CSSProperties;
  const format = image.format ?? "png";
  const responsive = format === "webp" ? {
    srcSet: `/pieces/${image.file}-640.webp ${Math.min(640, bounds.sourceWidth)}w, /pieces/${image.file}.webp ${bounds.sourceWidth}w`,
    sizes: detail ? "(max-width: 620px) calc(100vw - 72px), 600px" : "(max-width: 620px) 50vw, (max-width: 1100px) 33vw, 350px",
  } : {};

  return <span className="product-photo" style={frameStyle}>
    <span className="cutout-window" style={cropStyle}>
      <img src={`/pieces/${image.file}.${format}`} {...responsive} alt={image.alt} width={bounds.sourceWidth} height={bounds.sourceHeight} style={imageStyle} loading={eager ? "eager" : "lazy"} decoding="async" draggable={false} />
    </span>
  </span>;
}
