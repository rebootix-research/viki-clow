// swift-tools-version: 6.2
// Package manifest for the VikiClow macOS companion (menu bar app + IPC library).

import PackageDescription

let package = Package(
    name: "VikiClow",
    platforms: [
        .macOS(.v15),
    ],
    products: [
        .library(name: "VikiClowIPC", targets: ["VikiClowIPC"]),
        .library(name: "VikiClowDiscovery", targets: ["VikiClowDiscovery"]),
        .executable(name: "VikiClow", targets: ["VikiClow"]),
        .executable(name: "vikiclow-mac", targets: ["VikiClowMacCLI"]),
    ],
    dependencies: [
        .package(url: "https://github.com/orchetect/MenuBarExtraAccess", exact: "1.2.2"),
        .package(url: "https://github.com/swiftlang/swift-subprocess.git", from: "0.1.0"),
        .package(url: "https://github.com/apple/swift-log.git", from: "1.8.0"),
        .package(url: "https://github.com/sparkle-project/Sparkle", from: "2.8.1"),
        .package(url: "https://github.com/steipete/Peekaboo.git", branch: "main"),
        .package(path: "../shared/VikiClowKit"),
        .package(path: "../../Swabble"),
    ],
    targets: [
        .target(
            name: "VikiClowIPC",
            dependencies: [],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .target(
            name: "VikiClowDiscovery",
            dependencies: [
                .product(name: "VikiClowKit", package: "VikiClowKit"),
            ],
            path: "Sources/VikiClowDiscovery",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .executableTarget(
            name: "VikiClow",
            dependencies: [
                "VikiClowIPC",
                "VikiClowDiscovery",
                .product(name: "VikiClowKit", package: "VikiClowKit"),
                .product(name: "VikiClowChatUI", package: "VikiClowKit"),
                .product(name: "VikiClowProtocol", package: "VikiClowKit"),
                .product(name: "SwabbleKit", package: "swabble"),
                .product(name: "MenuBarExtraAccess", package: "MenuBarExtraAccess"),
                .product(name: "Subprocess", package: "swift-subprocess"),
                .product(name: "Logging", package: "swift-log"),
                .product(name: "Sparkle", package: "Sparkle"),
                .product(name: "PeekabooBridge", package: "Peekaboo"),
                .product(name: "PeekabooAutomationKit", package: "Peekaboo"),
            ],
            exclude: [
                "Resources/Info.plist",
            ],
            resources: [
                .copy("Resources/VikiClow.icns"),
                .copy("Resources/DeviceModels"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .executableTarget(
            name: "VikiClowMacCLI",
            dependencies: [
                "VikiClowDiscovery",
                .product(name: "VikiClowKit", package: "VikiClowKit"),
                .product(name: "VikiClowProtocol", package: "VikiClowKit"),
            ],
            path: "Sources/VikiClowMacCLI",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .testTarget(
            name: "VikiClowIPCTests",
            dependencies: [
                "VikiClowIPC",
                "VikiClow",
                "VikiClowDiscovery",
                .product(name: "VikiClowProtocol", package: "VikiClowKit"),
                .product(name: "SwabbleKit", package: "swabble"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
                .enableExperimentalFeature("SwiftTesting"),
            ]),
    ])
