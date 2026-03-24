// swift-tools-version: 6.2

import PackageDescription

let package = Package(
    name: "VikiClowKit",
    platforms: [
        .iOS(.v18),
        .macOS(.v15),
    ],
    products: [
        .library(name: "VikiClowProtocol", targets: ["VikiClowProtocol"]),
        .library(name: "VikiClowKit", targets: ["VikiClowKit"]),
        .library(name: "VikiClowChatUI", targets: ["VikiClowChatUI"]),
    ],
    dependencies: [
        .package(url: "https://github.com/steipete/ElevenLabsKit", exact: "0.1.0"),
        .package(url: "https://github.com/gonzalezreal/textual", exact: "0.3.1"),
    ],
    targets: [
        .target(
            name: "VikiClowProtocol",
            path: "Sources/VikiClowProtocol",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .target(
            name: "VikiClowKit",
            dependencies: [
                "VikiClowProtocol",
                .product(name: "ElevenLabsKit", package: "ElevenLabsKit"),
            ],
            path: "Sources/VikiClowKit",
            resources: [
                .process("Resources"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .target(
            name: "VikiClowChatUI",
            dependencies: [
                "VikiClowKit",
                .product(
                    name: "Textual",
                    package: "textual",
                    condition: .when(platforms: [.macOS, .iOS])),
            ],
            path: "Sources/VikiClowChatUI",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .testTarget(
            name: "VikiClowKitTests",
            dependencies: ["VikiClowKit", "VikiClowChatUI"],
            path: "Tests/VikiClowKitTests",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
                .enableExperimentalFeature("SwiftTesting"),
            ]),
    ])
