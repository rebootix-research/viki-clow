import Testing
@testable import VikiClow

@Suite(.serialized)
@MainActor
struct NodePairingApprovalPrompterTests {
    @Test func `node pairing approval prompter exercises`() async {
        await NodePairingApprovalPrompter.exerciseForTesting()
    }
}
