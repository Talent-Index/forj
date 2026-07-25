// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/// @title SkillForgeCredential
/// @notice Soulbound NFT credential for Avalanche learning achievements
contract SkillForgeCredential is ERC721, Ownable {
    using Strings for uint256;

    struct CredentialData {
        uint256 totalPoints;
        uint256 puzzleMask;
        uint8 easyCorrect;
        uint8 mediumCorrect;
        uint8 hardCorrect;
        string image;
        uint256 mintedAt;
    }

    uint256 private _nextTokenId;
    mapping(uint256 => CredentialData) public credentials;
    mapping(address => uint256) public credentialOf;

    event CredentialMinted(
        address indexed learner,
        uint256 indexed tokenId,
        uint256 totalPoints,
        uint256 puzzleMask
    );

    constructor() ERC721("SkillForge Avalanche Credential", "SFAVAX") Ownable(msg.sender) {}

    /// @notice Mint or upgrade a verifiable on-chain credential
    function mintCredential(
        uint256 totalPoints,
        uint256 puzzleMask,
        uint8 easyCorrect,
        uint8 mediumCorrect,
        uint8 hardCorrect,
        string calldata imageData
    ) external {
        require(totalPoints > 0, "No points earned");
        require(puzzleMask > 0 && puzzleMask <= 0xFFFF, "Invalid puzzle mask");
        require(easyCorrect <= 5 && mediumCorrect <= 5 && hardCorrect <= 5, "Invalid scores");

        uint256 existingId = credentialOf[msg.sender];
        if (existingId != 0) {
            _burn(existingId);
            delete credentials[existingId];
        }

        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);

        credentials[tokenId] = CredentialData({
            totalPoints: totalPoints,
            puzzleMask: puzzleMask,
            easyCorrect: easyCorrect,
            mediumCorrect: mediumCorrect,
            hardCorrect: hardCorrect,
            image: imageData,
            mintedAt: block.timestamp
        });

        credentialOf[msg.sender] = tokenId;
        emit CredentialMinted(msg.sender, tokenId, totalPoints, puzzleMask);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        CredentialData memory c = credentials[tokenId];

        // include image (may be data: URI or IPFS URL) into metadata
        string memory imageField = bytes(c.image).length > 0
            ? string(abi.encodePacked(',"image":"', c.image, '"'))
            : "";

        return string(
            abi.encodePacked(
                "data:application/json;base64,",
                Base64.encode(
                    bytes(
                        string(
                            abi.encodePacked(
                                '{"name":"SkillForge Avalanche Credential #',
                                tokenId.toString(),
                                '","description":"Verifiable competence credential earned on Avalanche."',
                                imageField,
                                ',"attributes":[',
                                '{"trait_type":"Total Points","value":',
                                c.totalPoints.toString(),
                                '},{"trait_type":"Puzzle Pieces","value":',
                                _countBits(c.puzzleMask).toString(),
                                '},{"trait_type":"Easy Correct","value":',
                                uint256(c.easyCorrect).toString(),
                                '},{"trait_type":"Medium Correct","value":',
                                uint256(c.mediumCorrect).toString(),
                                '},{"trait_type":"Hard Correct","value":',
                                uint256(c.hardCorrect).toString(),
                                "}] }"
                            )
                        )
                    )
                )
            )
        );
    }

    function _countBits(uint256 mask) internal pure returns (uint256 count) {
        while (mask > 0) {
            count += mask & 1;
            mask >>= 1;
        }
    }

    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) {
            revert("Soulbound: non-transferable");
        }
        return super._update(to, tokenId, auth);
    }
}

/// @dev Minimal Base64 encoder for on-chain metadata
library Base64 {
    string internal constant TABLE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

    function encode(bytes memory data) internal pure returns (string memory) {
        if (data.length == 0) return "";

        string memory table = TABLE;
        uint256 encodedLen = 4 * ((data.length + 2) / 3);
        string memory result = new string(encodedLen);
        assembly {
            let tablePtr := add(table, 1)
            let resultPtr := add(result, 32)
            let dataPtr := add(data, 32)
            let endPtr := add(dataPtr, mload(data))
            for {} lt(dataPtr, endPtr) {} {
                dataPtr := add(dataPtr, 3)
                let input := mload(dataPtr)
                mstore8(resultPtr, mload(add(tablePtr, and(shr(18, input), 0x3F))))
                resultPtr := add(resultPtr, 1)
                mstore8(resultPtr, mload(add(tablePtr, and(shr(12, input), 0x3F))))
                resultPtr := add(resultPtr, 1)
                mstore8(resultPtr, mload(add(tablePtr, and(shr(6, input), 0x3F))))
                resultPtr := add(resultPtr, 1)
                mstore8(resultPtr, mload(add(tablePtr, and(input, 0x3F))))
                resultPtr := add(resultPtr, 1)
            }
            switch mod(mload(data), 3)
            case 1 {
                mstore8(sub(resultPtr, 1), 0x3d)
                mstore8(sub(resultPtr, 2), 0x3d)
            }
            case 2 {
                mstore8(sub(resultPtr, 1), 0x3d)
            }
        }
        return result;
    }
}
