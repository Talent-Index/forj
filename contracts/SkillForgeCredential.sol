// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/// @title SkillForgeCredential
/// @notice Soulbound NFT credential for Avalanche learning achievements.
/// @dev Two mint paths:
///      - mintCredential: self-claimed scores. Anyone can mint for themselves.
///      - mintCredentialWithAuthorization: issuer-attested scores. Requires an EIP-712
///        signature from the contract owner. The learner nonce is consumed before mint
///        and rolls back if the transaction reverts.
contract SkillForgeCredential is ERC721, Ownable, EIP712 {
    using Strings for uint256;

    string public constant EIP712_NAME = "SkillForgeCredential";
    string public constant EIP712_VERSION = "1";

    bytes32 private constant CREDENTIAL_TYPEHASH = keccak256(
        "Credential(address learner,uint256 totalPoints,uint256 puzzleMask,uint8 easyCorrect,uint8 mediumCorrect,uint8 hardCorrect,bytes32 imageHash,uint256 nonce,uint256 deadline)"
    );

    struct CredentialData {
        uint256 totalPoints;
        uint256 puzzleMask;
        uint8 easyCorrect;
        uint8 mediumCorrect;
        uint8 hardCorrect;
        string image;
        uint256 mintedAt;
        bool attested;
    }

    uint256 private _nextTokenId = 1;
    mapping(uint256 => CredentialData) public credentials;
    mapping(address => uint256) public credentialOf;
    mapping(address => uint256) public authorizationNonces;

    event CredentialMinted(
        address indexed learner,
        uint256 indexed tokenId,
        uint256 totalPoints,
        uint256 puzzleMask,
        bool attested
    );

    constructor() ERC721("SkillForge Avalanche Credential", "SFAVAX") Ownable(msg.sender) EIP712(EIP712_NAME, EIP712_VERSION) {}

    /// @notice Mint a self-claimed credential for the caller.
    function mintCredential(
        uint256 totalPoints,
        uint256 puzzleMask,
        uint8 easyCorrect,
        uint8 mediumCorrect,
        uint8 hardCorrect,
        string calldata imageData
    ) external {
        _mintCredential(msg.sender, totalPoints, puzzleMask, easyCorrect, mediumCorrect, hardCorrect, imageData, false);
    }

    /// @notice Mint an issuer-attested credential authorized by the contract owner.
    function mintCredentialWithAuthorization(
        uint256 totalPoints,
        uint256 puzzleMask,
        uint8 easyCorrect,
        uint8 mediumCorrect,
        uint8 hardCorrect,
        string calldata imageData,
        uint256 deadline,
        bytes calldata signature
    ) external {
        require(block.timestamp <= deadline, "Authorization expired");

        uint256 nonce = authorizationNonces[msg.sender];
        bytes32 structHash = keccak256(
            abi.encode(
                CREDENTIAL_TYPEHASH,
                msg.sender,
                totalPoints,
                puzzleMask,
                easyCorrect,
                mediumCorrect,
                hardCorrect,
                keccak256(bytes(imageData)),
                nonce,
                deadline
            )
        );
        address signer = _recoverIssuer(_hashTypedDataV4(structHash), signature);
        require(signer == owner(), "Invalid authorization");

        // Consume the nonce before mint so a reentrant receiver cannot reuse this signature.
        // If mint later reverts, the whole transaction rolls back and the nonce is not spent.
        authorizationNonces[msg.sender] = nonce + 1;
        _mintCredential(msg.sender, totalPoints, puzzleMask, easyCorrect, mediumCorrect, hardCorrect, imageData, true);
    }

    function _recoverIssuer(bytes32 digest, bytes calldata signature) private pure returns (address signer) {
        if (signature.length != 65) {
            revert("Invalid authorization");
        }
        ECDSA.RecoverError error;
        (signer, error, ) = ECDSA.tryRecover(digest, signature);
        if (error != ECDSA.RecoverError.NoError || signer == address(0)) {
            revert("Invalid authorization");
        }
    }

    function _mintCredential(
        address learner,
        uint256 totalPoints,
        uint256 puzzleMask,
        uint8 easyCorrect,
        uint8 mediumCorrect,
        uint8 hardCorrect,
        string calldata imageData,
        bool attested
    ) internal {
        require(totalPoints > 0, "No points earned");
        require(puzzleMask > 0 && puzzleMask <= 0xFFFF, "Invalid puzzle mask");
        require(easyCorrect <= 5 && mediumCorrect <= 5 && hardCorrect <= 5, "Invalid scores");
        require(!_containsQuote(imageData), "Invalid image");

        uint256 existingId = credentialOf[learner];
        if (existingId != 0) {
            _burn(existingId);
            delete credentials[existingId];
        }

        uint256 tokenId = _nextTokenId++;
        _safeMint(learner, tokenId);

        credentials[tokenId] = CredentialData({
            totalPoints: totalPoints,
            puzzleMask: puzzleMask,
            easyCorrect: easyCorrect,
            mediumCorrect: mediumCorrect,
            hardCorrect: hardCorrect,
            image: imageData,
            mintedAt: block.timestamp,
            attested: attested
        });

        credentialOf[learner] = tokenId;
        emit CredentialMinted(learner, tokenId, totalPoints, puzzleMask, attested);
    }

    function _containsQuote(string calldata value) private pure returns (bool) {
        bytes memory data = bytes(value);
        for (uint256 i = 0; i < data.length; i++) {
            if (data[i] == 0x22) return true;
        }
        return false;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        CredentialData memory c = credentials[tokenId];

        string memory imageField = bytes(c.image).length > 0
            ? string.concat(',"image":"', c.image, '"')
            : "";

        string memory json = string.concat(
            '{"name":"SkillForge Avalanche Credential #',
            tokenId.toString(),
            '","description":"',
            c.attested
                ? "Issuer-attested SkillForge credential on Avalanche."
                : "Self-claimed SkillForge score record on Avalanche.",
            '"',
            imageField
        );
        json = string.concat(
            json,
            ',"attributes":[{"trait_type":"Total Points","value":',
            c.totalPoints.toString(),
            '},{"trait_type":"Puzzle Pieces","value":',
            _countBits(c.puzzleMask).toString(),
            '},{"trait_type":"Easy Correct","value":',
            uint256(c.easyCorrect).toString(),
            '},{"trait_type":"Medium Correct","value":',
            uint256(c.mediumCorrect).toString(),
            '},{"trait_type":"Hard Correct","value":',
            uint256(c.hardCorrect).toString(),
            '},{"trait_type":"Attestation","value":"',
            c.attested ? "Issuer attested" : "Self claimed",
            '"}]}'
        );

        return string.concat("data:application/json;base64,", Base64.encode(bytes(json)));
    }

    function _countBits(uint256 mask) internal pure returns (uint256 count) {
        while (mask > 0) {
            count += mask & 1;
            mask >>= 1;
        }
    }

    function approve(address, uint256) public pure override {
        revert("Soulbound: non-transferable");
    }

    function setApprovalForAll(address, bool) public pure override {
        revert("Soulbound: non-transferable");
    }

    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) {
            revert("Soulbound: non-transferable");
        }
        return super._update(to, tokenId, auth);
    }
}
