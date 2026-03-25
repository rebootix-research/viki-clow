// swift-tools-version: 6.2

import PackageDescription

let package = Package(
    name: "Swabble",
    platforms: [
        .macOS(.v15),
        .iOS(.v18),
    ],
    products: [
        .library(name: "SwabbleKit", targets: ["SwabbleKit"]),
    ],
    targets: [
        .target(
            name: "SwabbleKit",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
    ])
