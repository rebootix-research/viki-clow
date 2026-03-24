import AppKit

enum VikiMarkRenderer {
    private static let size = NSSize(width: 18, height: 18)

    struct Badge {
        let symbolName: String
        let prominence: IconState.BadgeProminence
    }

    private struct Canvas {
        let w: CGFloat
        let h: CGFloat
        let stepX: CGFloat
        let stepY: CGFloat
        let snapX: (CGFloat) -> CGFloat
        let snapY: (CGFloat) -> CGFloat
        let context: CGContext
    }

    private struct Geometry {
        let shellPath: CGPath
        let sparkRect: CGRect
        let vTopY: CGFloat
        let vDepth: CGFloat
        let vHalfWidth: CGFloat
        let signalInset: CGFloat
        let signalSpread: CGFloat
        let signalHeight: CGFloat
        let notchWidth: CGFloat
        let sleepLineWidth: CGFloat

        init(canvas: Canvas, legWiggle: CGFloat, earWiggle: CGFloat, earScale: CGFloat) {
            let w = canvas.w
            let h = canvas.h
            let snapX = canvas.snapX
            let snapY = canvas.snapY

            let scaleBoost = 0.96 + max(0, min(earScale, 2)) * 0.04
            let topY = snapY(h * 0.07)
            let upperY = snapY(h * (0.26 + abs(earWiggle) * 0.01))
            let sideInset = snapX(w * (0.12 - min(abs(earWiggle), 1.6) * 0.01))
            let lowerInset = snapX(w * 0.22 / scaleBoost)
            let bottomY = snapY(h * 0.95)

            let shell = CGMutablePath()
            shell.move(to: CGPoint(x: snapX(w * 0.5), y: topY))
            shell.addLine(to: CGPoint(x: snapX(w - sideInset), y: upperY))
            shell.addLine(to: CGPoint(x: snapX(w - lowerInset), y: bottomY))
            shell.addLine(to: CGPoint(x: snapX(lowerInset), y: bottomY))
            shell.addLine(to: CGPoint(x: snapX(sideInset), y: upperY))
            shell.closeSubpath()

            let sparkSize = snapX(w * 0.16 * scaleBoost)

            self.shellPath = shell
            self.sparkRect = CGRect(
                x: snapX(w * 0.5 - sparkSize / 2),
                y: snapY(h * 0.16),
                width: sparkSize,
                height: snapY(sparkSize * 1.08)
            )
            self.vTopY = snapY(h * 0.34)
            self.vDepth = snapY(h * (0.36 + legWiggle * 0.08))
            self.vHalfWidth = snapX(w * (0.16 + earScale * 0.01))
            self.signalInset = snapX(w * 0.18)
            self.signalSpread = snapX(w * (0.08 + max(0, legWiggle) * 0.02))
            self.signalHeight = snapY(h * 0.2)
            self.notchWidth = snapX(w * 0.12)
            self.sleepLineWidth = snapX(w * 0.24)
        }
    }

    private struct FaceOptions {
        let blink: CGFloat
        let earHoles: Bool
        let earScale: CGFloat
        let eyesClosedLines: Bool
    }

    static func makeIcon(
        blink: CGFloat,
        legWiggle: CGFloat = 0,
        earWiggle: CGFloat = 0,
        earScale: CGFloat = 1,
        earHoles: Bool = false,
        eyesClosedLines: Bool = false,
        badge: Badge? = nil
    ) -> NSImage {
        guard let rep = self.makeBitmapRep() else {
            return NSImage(size: self.size)
        }
        rep.size = self.size

        NSGraphicsContext.saveGraphicsState()
        defer { NSGraphicsContext.restoreGraphicsState() }

        guard let context = NSGraphicsContext(bitmapImageRep: rep) else {
            return NSImage(size: self.size)
        }
        NSGraphicsContext.current = context
        context.imageInterpolation = .none
        context.cgContext.setShouldAntialias(false)

        let canvas = self.makeCanvas(for: rep, context: context)
        let geometry = Geometry(
            canvas: canvas,
            legWiggle: legWiggle,
            earWiggle: earWiggle,
            earScale: earScale
        )

        self.drawShell(in: canvas, geometry: geometry)
        self.drawMark(
            in: canvas,
            geometry: geometry,
            options: FaceOptions(
                blink: blink,
                earHoles: earHoles,
                earScale: earScale,
                eyesClosedLines: eyesClosedLines
            )
        )

        if let badge {
            self.drawBadge(badge, canvas: canvas)
        }

        let image = NSImage(size: size)
        image.addRepresentation(rep)
        image.isTemplate = true
        return image
    }

    private static func makeBitmapRep() -> NSBitmapImageRep? {
        let pixelsWide = 36
        let pixelsHigh = 36
        return NSBitmapImageRep(
            bitmapDataPlanes: nil,
            pixelsWide: pixelsWide,
            pixelsHigh: pixelsHigh,
            bitsPerSample: 8,
            samplesPerPixel: 4,
            hasAlpha: true,
            isPlanar: false,
            colorSpaceName: .deviceRGB,
            bitmapFormat: [],
            bytesPerRow: 0,
            bitsPerPixel: 0
        )
    }

    private static func makeCanvas(for rep: NSBitmapImageRep, context: NSGraphicsContext) -> Canvas {
        let stepX = self.size.width / max(CGFloat(rep.pixelsWide), 1)
        let stepY = self.size.height / max(CGFloat(rep.pixelsHigh), 1)
        let snapX: (CGFloat) -> CGFloat = { ($0 / stepX).rounded() * stepX }
        let snapY: (CGFloat) -> CGFloat = { ($0 / stepY).rounded() * stepY }

        return Canvas(
            w: snapX(size.width),
            h: snapY(size.height),
            stepX: stepX,
            stepY: stepY,
            snapX: snapX,
            snapY: snapY,
            context: context.cgContext
        )
    }

    private static func drawShell(in canvas: Canvas, geometry: Geometry) {
        canvas.context.setFillColor(NSColor.labelColor.cgColor)
        canvas.context.addPath(geometry.shellPath)
        canvas.context.fillPath()
    }

    private static func drawMark(in canvas: Canvas, geometry: Geometry, options: FaceOptions) {
        canvas.context.saveGState()
        canvas.context.setBlendMode(.clear)
        canvas.context.setLineCap(.round)
        canvas.context.setLineJoin(.round)

        if options.earHoles || options.earScale > 1.05 {
            canvas.context.addPath(CGPath(ellipseIn: geometry.sparkRect, transform: nil))
            canvas.context.fillPath()
        }

        if options.eyesClosedLines {
            let y = canvas.snapY(canvas.h * 0.52)
            let restPath = CGMutablePath()
            restPath.move(to: CGPoint(x: canvas.snapX(canvas.w * 0.35), y: y))
            restPath.addLine(to: CGPoint(x: canvas.snapX(canvas.w * 0.65), y: y))
            canvas.context.addPath(restPath)
            canvas.context.setLineWidth(max(canvas.stepX * 2, geometry.sleepLineWidth * 0.22))
            canvas.context.strokePath()
        } else {
            let chevronDepth = canvas.snapY(
                geometry.vDepth * (1 - max(0, min(options.blink, 1)) * 0.45)
            )
            let chevronPath = CGMutablePath()
            chevronPath.move(to: CGPoint(
                x: canvas.snapX(canvas.w * 0.5 - geometry.vHalfWidth),
                y: geometry.vTopY
            ))
            chevronPath.addLine(to: CGPoint(
                x: canvas.snapX(canvas.w * 0.5),
                y: canvas.snapY(geometry.vTopY + chevronDepth)
            ))
            chevronPath.addLine(to: CGPoint(
                x: canvas.snapX(canvas.w * 0.5 + geometry.vHalfWidth),
                y: geometry.vTopY
            ))
            canvas.context.addPath(chevronPath)
            canvas.context.setLineWidth(max(canvas.stepX * 3, geometry.notchWidth))
            canvas.context.strokePath()

            let signalWidth = max(canvas.stepX * 2, geometry.notchWidth * 0.45)
            let signalTop = canvas.snapY(geometry.vTopY + geometry.signalSpread * 0.5)
            let signalBottom = canvas.snapY(signalTop + geometry.signalHeight)
            for direction in [CGFloat(-1), CGFloat(1)] {
                let x = canvas.snapX(canvas.w * 0.5 + direction * geometry.signalInset)
                let signalPath = CGMutablePath()
                signalPath.move(to: CGPoint(x: x, y: signalTop))
                signalPath.addLine(to: CGPoint(
                    x: canvas.snapX(x + direction * geometry.signalSpread),
                    y: signalBottom
                ))
                canvas.context.addPath(signalPath)
                canvas.context.setLineWidth(signalWidth)
                canvas.context.strokePath()
            }
        }

        canvas.context.restoreGState()
    }

    private static func drawBadge(_ badge: Badge, canvas: Canvas) {
        let strength: CGFloat = switch badge.prominence {
        case .primary: 1.0
        case .secondary: 0.58
        case .overridden: 0.85
        }

        let diameter = canvas.snapX(canvas.w * 0.52 * (0.92 + 0.08 * strength))
        let margin = canvas.snapX(max(0.45, canvas.w * 0.03))
        let rect = CGRect(
            x: canvas.snapX(canvas.w - diameter - margin),
            y: canvas.snapY(margin),
            width: diameter,
            height: diameter
        )

        canvas.context.saveGState()
        canvas.context.setShouldAntialias(true)

        canvas.context.saveGState()
        canvas.context.setBlendMode(.clear)
        canvas.context.addEllipse(in: rect.insetBy(dx: -1.0, dy: -1.0))
        canvas.context.fillPath()
        canvas.context.restoreGState()

        let fillAlpha: CGFloat = min(1.0, 0.36 + 0.24 * strength)
        let strokeAlpha: CGFloat = min(1.0, 0.78 + 0.22 * strength)

        canvas.context.setFillColor(NSColor.labelColor.withAlphaComponent(fillAlpha).cgColor)
        canvas.context.addEllipse(in: rect)
        canvas.context.fillPath()

        canvas.context.setStrokeColor(NSColor.labelColor.withAlphaComponent(strokeAlpha).cgColor)
        canvas.context.setLineWidth(max(1.25, canvas.snapX(canvas.w * 0.075)))
        canvas.context.strokeEllipse(in: rect.insetBy(dx: 0.45, dy: 0.45))

        if let base = NSImage(systemSymbolName: badge.symbolName, accessibilityDescription: nil) {
            let pointSize = max(7.0, diameter * 0.82)
            let config = NSImage.SymbolConfiguration(pointSize: pointSize, weight: .black)
            let symbol = base.withSymbolConfiguration(config) ?? base
            symbol.isTemplate = true

            let symbolRect = rect.insetBy(dx: diameter * 0.17, dy: diameter * 0.17)
            canvas.context.saveGState()
            canvas.context.setBlendMode(.clear)
            symbol.draw(
                in: symbolRect,
                from: .zero,
                operation: .sourceOver,
                fraction: 1,
                respectFlipped: true,
                hints: nil
            )
            canvas.context.restoreGState()
        }

        canvas.context.restoreGState()
    }
}
