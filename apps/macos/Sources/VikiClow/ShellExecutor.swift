import Foundation
import VikiClowIPC

enum ShellExecutor {
    struct ShellResult {
        var stdout: String
        var stderr: String
        var exitCode: Int?
        var timedOut: Bool
        var success: Bool
        var errorMessage: String?
    }

    static func runDetailed(
        command: [String],
        cwd: String?,
        env: [String: String]?,
        timeout: Double?) async -> ShellResult
    {
        guard !command.isEmpty else {
            return ShellResult(
                stdout: "",
                stderr: "",
                exitCode: nil,
                timedOut: false,
                success: false,
                errorMessage: "empty command")
        }

        let process = Process()
        process.executableURL = URL(fileURLWithPath: "/usr/bin/env")
        process.arguments = command
        if let cwd { process.currentDirectoryURL = URL(fileURLWithPath: cwd) }
        if let env { process.environment = env }

        let stdoutPipe = Pipe()
        let stderrPipe = Pipe()
        process.standardOutput = stdoutPipe
        process.standardError = stderrPipe

        do {
            try process.run()
        } catch {
            return ShellResult(
                stdout: "",
                stderr: "",
                exitCode: nil,
                timedOut: false,
                success: false,
                errorMessage: "failed to start: \(error.localizedDescription)")
        }

        let outTask = Task { stdoutPipe.fileHandleForReading.readToEndSafely() }
        let errTask = Task { stderrPipe.fileHandleForReading.readToEndSafely() }
        let exitTask = Task.detached(priority: .utility) {
            process.waitUntilExit()
        }

        func finalizeResult(timedOut: Bool) async -> ShellResult {
            let out = await outTask.value
            let err = await errTask.value
            let status = Int(process.terminationStatus)
            return ShellResult(
                stdout: String(bytes: out, encoding: .utf8) ?? "",
                stderr: String(bytes: err, encoding: .utf8) ?? "",
                exitCode: timedOut ? nil : status,
                timedOut: timedOut,
                success: !timedOut && status == 0,
                errorMessage: timedOut ? "timeout" : (status == 0 ? nil : "exit \(status)"))
        }

        if let timeout, timeout > 0 {
            let timeoutNanos = UInt64(timeout * 1_000_000_000)
            let timedOut = await withTaskGroup(of: Bool.self, returning: Bool.self) { group in
                group.addTask {
                    await exitTask.value
                    return false
                }
                group.addTask {
                    do {
                        try await Task.sleep(nanoseconds: timeoutNanos)
                        return true
                    } catch {
                        return false
                    }
                }

                let first = await group.next() ?? false
                group.cancelAll()
                return first
            }

            if timedOut {
                process.terminate()
                await exitTask.value
                return await finalizeResult(timedOut: true)
            }

            return await finalizeResult(timedOut: false)
        }

        await exitTask.value
        return await finalizeResult(timedOut: false)
    }

    static func run(command: [String], cwd: String?, env: [String: String]?, timeout: Double?) async -> Response {
        let result = await self.runDetailed(command: command, cwd: cwd, env: env, timeout: timeout)
        let combined = result.stdout.isEmpty ? result.stderr : result.stdout
        let payload = combined.isEmpty ? nil : Data(combined.utf8)
        return Response(ok: result.success, message: result.errorMessage, payload: payload)
    }
}
