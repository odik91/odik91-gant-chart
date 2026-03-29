/**
 * jsdom tidak mengimplementasikan API SVG yang dipakai Gantt (mis. createSVGPoint).
 */
function patchSvgPrototype() {
  if (typeof SVGSVGElement === "undefined") {
    return;
  }

  if (!SVGSVGElement.prototype.createSVGPoint) {
    SVGSVGElement.prototype.createSVGPoint = function createSVGPoint() {
      const pt = {
        x: 0,
        y: 0,
        matrixTransform: () => ({ x: pt.x, y: pt.y }),
      };
      return pt as SVGPoint;
    };
  }

  if (!SVGSVGElement.prototype.getScreenCTM) {
    SVGSVGElement.prototype.getScreenCTM = function getScreenCTM() {
      return {
        inverse: () => ({
          a: 1,
          b: 0,
          c: 0,
          d: 1,
          e: 0,
          f: 0,
        }),
      } as DOMMatrix;
    };
  }
}

patchSvgPrototype();
