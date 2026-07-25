const TOKEN = import.meta.env.VITE_NFT_STORAGE_KEY || "";

export async function pinFileToIPFS(file) {
  if (!TOKEN) throw new Error('VITE_NFT_STORAGE_KEY not set');
  const formData = new FormData();
  formData.append('file', file, file.name || 'image.png');

  const response = await fetch('https://api.nft.storage/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`IPFS pin failed: ${response.status} ${response.statusText} ${detail}`);
  }

  const json = await response.json();
  const cid = json.value?.cid;
  if (!cid) {
    throw new Error('IPFS pin returned no CID');
  }

  return {
    ipfs: `ipfs://${cid}`,
    gateway: `https://nftstorage.link/ipfs/${cid}`,
    cid,
  };
}
