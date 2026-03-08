declare module "dom-to-image-more" {
    interface Options {
        quality?: number;
        bgcolor?: string;
        style?: Partial<CSSStyleDeclaration>;
        width?: number;
        height?: number;
        filter?: (node: Node) => boolean;
        imagePlaceholder?: string;
        cacheBust?: boolean;
    }

    export function toPng(node: Node, options?: Options): Promise<string>;
    export function toJpeg(node: Node, options?: Options): Promise<string>;
    export function toBlob(node: Node, options?: Options): Promise<Blob>;
    export function toPixelData(node: Node, options?: Options): Promise<Uint8ClampedArray>;
    export function toSvg(node: Node, options?: Options): Promise<string>;

    const domToImageMore: {
        toPng: typeof toPng;
        toJpeg: typeof toJpeg;
        toBlob: typeof toBlob;
        toPixelData: typeof toPixelData;
        toSvg: typeof toSvg;
    };
    export default domToImageMore;
}
