// qrread.swift — decode a QR with Apple's own detector.
//
// The authority on whether a phone can read it is the thing in the phone. A JS
// decoder said no to a code that every camera read fine, so this is the check.
import Foundation
import CoreImage
let path = CommandLine.arguments[1]
guard let img = CIImage(contentsOf: URL(fileURLWithPath: path)) else { print("LOAD FAILED"); exit(1) }
let det = CIDetector(ofType: CIDetectorTypeQRCode, context: CIContext(),
                     options: [CIDetectorAccuracy: CIDetectorAccuracyHigh])!
let found = det.features(in: img).compactMap { ($0 as? CIQRCodeFeature)?.messageString }
if found.isEmpty { print("NO QR FOUND"); exit(2) }
found.forEach { print("DECODED: \($0)") }
