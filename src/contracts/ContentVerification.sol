// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title ContentVerification
 * @notice Blockchain-based verification system for content transformations
 * @dev Records transformation hashes, approval chains, and audit trails
 */
contract ContentVerification {
    struct Transformation {
        string contentHash;          // SHA-256 of source content
        string outputHash;           // SHA-256 of generated output
        string outputType;           // e.g., "LinkedIn Post", "Video Package"
        address operator;            // Who requested the transformation
        uint256 timestamp;           // When it was created
        uint256 blockNumber;         // Ethereum block number
        bool verified;               // Verification status
        string[] complianceBadges;   // Compliance certifications
        string threatLevel;          // Threat assessment level
    }

    struct ApprovalRecord {
        bytes32 transformationId;
        address approver;
        uint256 timestamp;
        bool approved;
        string role;                 // e.g., "Security Officer", "Content Manager"
    }

    struct AuditEntry {
        bytes32 transformationId;
        string action;               // e.g., "CREATED", "APPROVED", "PUBLISHED"
        address actor;
        uint256 timestamp;
        string metadata;             // Additional context JSON
    }

    // Mappings
    mapping(bytes32 => Transformation) public transformations;
    mapping(bytes32 => ApprovalRecord[]) public approvalChains;
    mapping(bytes32 => AuditEntry[]) public auditTrails;
    mapping(address => bool) public authorizedOperators;
    mapping(bytes32 => bool) public publishedOutputs; // Prevent re-publication

    // Events
    event TransformationRecorded(bytes32 indexed id, address operator, string outputType, uint256 timestamp);
    event ApprovalGranted(bytes32 indexed id, address approver, string role, uint256 timestamp);
    event OutputVerified(bytes32 indexed id, bool verified, uint256 timestamp);
    event ContentPublished(bytes32 indexed id, address publisher, uint256 timestamp);
    event AuditLogged(bytes32 indexed id, string action, address actor, uint256 timestamp);
    event UnauthorizedAccess(address operator, bytes32 transformationId, uint256 timestamp);

    // Modifiers
    modifier onlyAuthorized() {
        require(authorizedOperators[msg.sender], "Unauthorized operator");
        _;
    }

    constructor() {
        authorizedOperators[msg.sender] = true;
    }

    /**
     * @notice Register a new content transformation on-chain
     */
    function recordTransformation(
        bytes32 _id,
        string calldata _contentHash,
        string calldata _outputHash,
        string calldata _outputType,
        string calldata _threatLevel
    ) external onlyAuthorized returns (bytes32) {
        require(bytes(transformations[_id].contentHash).length == 0, "Transformation already exists");

        transformations[_id] = Transformation({
            contentHash: _contentHash,
            outputHash: _outputHash,
            outputType: _outputType,
            operator: msg.sender,
            timestamp: block.timestamp,
            blockNumber: block.number,
            verified: false,
            complianceBadges: new string[](0),
            threatLevel: _threatLevel
        });

        _logAudit(_id, "CREATED", msg.sender, _outputType);
        emit TransformationRecorded(_id, msg.sender, _outputType, block.timestamp);
        return _id;
    }

    /**
     * @notice Add compliance badge to a transformation
     */
    function addComplianceBadge(bytes32 _id, string calldata _badge) external onlyAuthorized {
        require(bytes(transformations[_id].contentHash).length != 0, "Transformation not found");
        transformations[_id].complianceBadges.push(_badge);
        _logAudit(_id, "COMPLIANCE_ADDED", msg.sender, _badge);
    }

    /**
     * @notice Record an approval in the multi-sig chain
     */
    function recordApproval(
        bytes32 _id,
        bool _approved,
        string calldata _role
    ) external {
        require(authorizedOperators[msg.sender], "Unauthorized operator");
        require(bytes(transformations[_id].contentHash).length != 0, "Transformation not found");

        approvalChains[_id].push(ApprovalRecord({
            transformationId: _id,
            approver: msg.sender,
            timestamp: block.timestamp,
            approved: _approved,
            role: _role
        }));

        string memory action = _approved ? "APPROVED" : "REJECTED";
        _logAudit(_id, action, msg.sender, _role);
        emit ApprovalGranted(_id, msg.sender, _role, block.timestamp);
    }

    /**
     * @notice Verify transformation authenticity
     */
    function verifyTransformation(
        bytes32 _id,
        string calldata _outputHash
    ) external onlyAuthorized returns (bool) {
        require(bytes(transformations[_id].contentHash).length != 0, "Transformation not found");

        bool isValid = keccak256(abi.encodePacked(_outputHash)) ==
                       keccak256(abi.encodePacked(transformations[_id].outputHash));

        transformations[_id].verified = isValid;
        _logAudit(_id, isValid ? "VERIFIED" : "VERIFICATION_FAILED", msg.sender, _outputHash);
        emit OutputVerified(_id, isValid, block.timestamp);

        return isValid;
    }

    /**
     * @notice Mark output as published (prevents re-publication)
     */
    function publishOutput(bytes32 _id) external onlyAuthorized {
        require(transformations[_id].verified, "Output not verified");
        require(!publishedOutputs[_id], "Already published");
        publishedOutputs[_id] = true;
        _logAudit(_id, "PUBLISHED", msg.sender, "");
        emit ContentPublished(_id, msg.sender, block.timestamp);
    }

    /**
     * @notice Check if output has been published
     */
    function isPublished(bytes32 _id) external view returns (bool) {
        return publishedOutputs[_id];
    }

    /**
     * @notice Get transformation details
     */
    function getTransformation(bytes32 _id) external view returns (Transformation memory) {
        require(bytes(transformations[_id].contentHash).length != 0, "Not found");
        return transformations[_id];
    }

    /**
     * @notice Get approval chain for a transformation
     */
    function getApprovalChain(bytes32 _id) external view returns (ApprovalRecord[] memory) {
        return approvalChains[_id];
    }

    /**
     * @notice Get audit trail for a transformation
     */
    function getAuditTrail(bytes32 _id) external view returns (AuditEntry[] memory) {
        return auditTrails[_id];
    }

    /**
     * @notice Authorize a new operator
     */
    function authorizeOperator(address _operator) external {
        require(authorizedOperators[msg.sender], "Unauthorized");
        authorizedOperators[_operator] = true;
    }

    // Internal functions
    function _logAudit(bytes32 _id, string calldata _action, address _actor, string calldata _metadata) internal {
        auditTrails[_id].push(AuditEntry({
            transformationId: _id,
            action: _action,
            actor: _actor,
            timestamp: block.timestamp,
            metadata: _metadata
        }));
        emit AuditLogged(_id, _action, _actor, block.timestamp);
    }
}
