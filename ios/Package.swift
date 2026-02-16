// swift-tools-version: 5.9
// Package.swift für Basaltemperatur iOS App

import PackageDescription

let package = Package(
    name: "Basaltemperatur",
    platforms: [
        .iOS(.v17)
    ],
    products: [
        .library(
            name: "Basaltemperatur",
            targets: ["Basaltemperatur"]
        ),
    ],
    targets: [
        .target(
            name: "Basaltemperatur",
            path: "Basaltemperatur"
        ),
    ]
)
