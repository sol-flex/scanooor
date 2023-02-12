const Metaplex = require("@metaplex-foundation/js")
const Solana = require("@solana/web3.js")
const Anchor = require("@project-serum/anchor")
const axios = require("axios");
const SPL = require("@solana/spl-token")
const msgpack = require('@msgpack/msgpack')
const MIP1 = require("@metaplex-foundation/mpl-token-auth-rules")

const SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID = new Solana.PublicKey(
    'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
  );

const connection = new Solana.Connection(Solana.clusterApiUrl("mainnet-beta"));
const metaplex = new Metaplex.Metaplex(connection);

const TOKEN_METADATA_PROGRAM_ID = new Solana.PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")

const mintAddress = new Solana.PublicKey("SEED4sAHMmLKwiwndkPPCyGcY53i9RMoPagzXbHtpyK");
//OCP
const ocpProgramId = new Solana.PublicKey("ocp4vWUzA2z2XMYJ3QhM9vWdyoyoQwAFJhRdVTbvo9E");
//Cardinal Labs
const MINT_MANAGER_PROGRAM_ID = new Solana.PublicKey("mgr99QFMYByTqGPWmNqunV7vBLmWWXdSrHUfV8Jf3JM")
const tokenAddress = new Solana.PublicKey("5hnVnNPS7GYbtZArsU9brYwVpf33b2NEhFyLP7CRRuMm")
const walletAddress = new Solana.PublicKey("EyByisrhqy9uzWt7YYawnY89ZeQARN2DAfHCNSBMVESu")
const associatedTokenAccount = new Solana.PublicKey("3GZsxfQLn55qkHUwFzBuwBPG865yTnxEM1MFCfeDqTYB")

const genericAccountTesting = new Solana.PublicKey("FvC6kPs4BCFke2zgDZaBnuoqcaD4t2DcbFmmqUrShVa9")

async function findByMint(mintAddress) {

    const nft = await metaplex.nfts().findByMint({ mintAddress });

    console.log("NFT RIGHT HERE: ", nft);
    console.log("supply: ", BigInt(nft.mint.supply.basisPoints));
    

    const mintStatePk = findMintStatePk(mintAddress)
    const mintStateAcc = await getMintStateAccountInfo(mintStatePk);

    if(nft.tokenStandard === 0) {
        const ownerWalletAddress = await getOwnerWalletFromMint(mintAddress)
        console.log("owner wallet: ", ownerWalletAddress)
        const associatedTokenAccount = await findAssociatedTokenAddress(ownerWalletAddress, mintAddress)

        console.log("ATA: ", associatedTokenAccount);

        const associatedTokenAccountInfo = await getAccountInfo(associatedTokenAccount)

        console.log("ATA info", associatedTokenAccountInfo);
        console.log("Associated Token Account Address: ", associatedTokenAccount.toBase58());
        console.log("Associated Token Account Delegate: ", associatedTokenAccountInfo.info.delegate);
        console.log("Associated Token Account Delegated Amount: ", associatedTokenAccountInfo.info.delegate === undefined | associatedTokenAccountInfo.info.delegate === null ? null : associatedTokenAccountInfo.info.delegatedAmount.amount);
        console.log("Associated Token Account state: ", associatedTokenAccountInfo.info.state);
    }

    console.log(nft)
    console.log("Update Authority Address: ", nft.updateAuthorityAddress.toBase58());
    console.log("Type: ", nft.model);
    console.log("JSON: ", nft.json);
    console.log("Collection: ", nft.collection === null ? null : nft.collection.address.toBase58());
    console.log("Collection verified?: ", nft.collection === null ? null : nft.collection.verified);
    console.log("Collection Details: ", nft.collectionDetails);
    console.log("Collection Details: ", nft.collectionDetails);
    console.log("Mint Authority: ", nft.mint.mintAuthorityAddress === null | undefined ? null : nft.mint.mintAuthorityAddress.toBase58());
    console.log("Freeze Authority: ", nft.mint.freezeAuthorityAddress === null | undefined ? null : nft.mint.freezeAuthorityAddress.toBase58());
    console.log("Decimals: ", nft.mint.decimals);
    console.log("supply: ", BigInt(await nft.mint.supply.basisPoints));
    console.log("Seller Fee: ", nft.sellerFeeBasisPoints);
    console.log("Creators: ", nft.creators);
    console.log("Token Standard: ", nft.tokenStandard);
    console.log("Metadata PDA: ", nft.metadataAddress.toBase58());
    console.log("Edition: ", nft.edition === undefined | null ? null : nft.edition.model);
    console.log("Edition is original?: ", nft.edition === undefined | null ? null : nft.edition.isOriginal);
    console.log("Edition account address ", nft.edition === undefined | null ? null : nft.edition.address.toBase58());
    console.log("Edition account - supply ", nft.edition === undefined | null ? null : BigInt(await nft.edition.supply));
    console.log("Edition account - max supply ", nft.edition === undefined | null ? null : nft.edition.maxSupply);
    console.log("is OCP? ", mintStateAcc === null? false : true);


}

const findMintStatePk = (mint) => {

    const mintStatePk = Solana.PublicKey.findProgramAddressSync(
      [Anchor.utils.bytes.utf8.encode("mint_state"), mint.toBuffer()],
      ocpProgramId
    )[0];

    console.log(mintStatePk)

    return mintStatePk;

};

const findTokenRecordAccount = (mint, ATA) => {

    const mintStatePk = Solana.PublicKey.findProgramAddressSync(
      [Anchor.utils.bytes.utf8.encode("metadata"), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer(), Anchor.utils.bytes.utf8.encode("token_record"), ATA.toBuffer()],
      TOKEN_METADATA_PROGRAM_ID
    )[0];

    console.log(mintStatePk)

    return mintStatePk;

};

// findTokenRecordAccount(new Solana.PublicKey("5KBbEfkCQQ3qwaRKJi1pjUVE2oGwASTrWco8Tw7WTeX8"), new Solana.PublicKey("8MFnE9KLFZJY9E59JSkN8vGT8Si28h73AhshqyPH1v9B"))

const getMintStateAccountInfo = async (mintStatePk) => {
      const mintStateAcc =  await connection.getAccountInfo(mintStatePk);
      console.log(mintStateAcc);
      return mintStateAcc;
}

const getMintManagerAccountInfo = async (mintManagerPk) => {
    const mintManagerAcc =  await connection.getAccountInfo(mintManagerPk);
    console.log(mintManagerAcc);
    return mintManagerAcc;
}


// const mintStatePk = findMintStatePk(mintAddress)
// const mintStateAcc = getMintStateAccountInfo(mintStatePk);

// findByMint(mintAddress);

async function getAccountInfo(pubKey) {

    const response = await axios({
        method: 'post',
        url: `https://api.mainnet-beta.solana.com`,
        data: {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "getAccountInfo",
            "params": [
              `${pubKey.toString()}`,
              {
                "encoding": "base64"
              }
            ]
          }
      }) 

      // console.log(response);
      //console.log("Token delegate: ", response.data.result.value.data.parsed.info.delegate)
      //console.log("Delegated amount: ", response.data.result.value.data.parsed.info.delegatedAmount.amount)
      // console.log("State of token account: ", response.data.result.value.data.parsed.info.state)


      return response

}



// getAccountInfo(mintAddress);


async function getOwnerWalletFromMint(mintAddress) {
    const response = await axios({
        method: 'get',
        url: `https://api-mainnet.magiceden.dev/v2/tokens/${mintAddress.toString()}`,
      })
      console.log(Object.keys(response.data).length === 0);
      return Object.keys(response.data).length === 0 ? false : new Solana.PublicKey(response.data.owner)

}

async function findAssociatedTokenAddress(ownerWallet, tokenMint) {

    const associatedTokenAccount = (await Solana.PublicKey.findProgramAddress(
        [
            ownerWallet.toBuffer(),
            SPL.TOKEN_PROGRAM_ID.toBuffer(),
            tokenMint.toBuffer(),
        ],
        SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID
    ))[0];

    console.log(associatedTokenAccount)

    return associatedTokenAccount;

}

async function findCardinalLabsMintManagerPDA(tokenMint) {

    const mintManagerPDA = (await Solana.PublicKey.findProgramAddress(
        [
            Buffer.from('mint-manager'),
            tokenMint.toBuffer(),
        ],
        MINT_MANAGER_PROGRAM_ID
    ))[0];

    console.log(mintManagerPDA)

    return mintManagerPDA;

}

// findCardinalLabsMintManagerPDA(new Solana.PublicKey("7FaDrcUPSU3n2oKSmHzGsVNuWT9gqPbMa7SNfAAMWYNb"))

async function getTokenLargestAccounts(mintAddress) {

    const connection = new Solana.Connection("https://burned-yolo-night.solana-mainnet.quiknode.pro/895b449661dccbdfbaf12ddef781ae2ac98f800b/");
    const largestAccounts = await connection.getTokenLargestAccounts(mintAddress);
    const largestAccountInfo = await connection.getParsedAccountInfo(
    largestAccounts.value[0].address
    );
    console.log(new Solana.PublicKey(largestAccountInfo.value.data.parsed.info.owner));

    return new Solana.PublicKey(largestAccountInfo.value.data.parsed.info.owner);
}

async function decodeRulesetData(pubKey) {
    const accountInfo = await getAccountInfo(new Solana.PublicKey("eBJLFYPxJmMGKuFwpDWkzxZeUrad92kZRC5BJLpzyT9"))
    console.log(accountInfo.data.result)
    const data = Buffer.from(accountInfo?.data.result.value.data[0], "base64")
    console.log(data)
    const blah = MIP1.getLatestRuleSet(data)
    console.log(blah)

}

async function getTransactions(mintAddress, numTx) {

    let transactionList = await connection.getSignaturesForAddress(mintAddress, { limit:numTx });
    console.log(transactionList)
}

decodeRulesetData(new Solana.PublicKey("eBJLFYPxJmMGKuFwpDWkzxZeUrad92kZRC5BJLpzyT9"))

// getOwnerWalletFromMint(mintAddress);

// findAssociatedTokenAddress(new Solana.PublicKey("1BWutmTvYPwDtmw9abTkS4Ssr8no61spGAvW1X6NDix"), new Solana.PublicKey("5KBbEfkCQQ3qwaRKJi1pjUVE2oGwASTrWco8Tw7WTeX8"))

// getAccountInfo(new Solana.PublicKey("7evQhBswiztNd6HLvNWsh1Ekc3fmyvQGnL82uDepSMbw"));

// findByMint(new Solana.PublicKey("24hdE64cBuzWJq8KSGgKvgSBJz3TpE2Mt8AfC7NCf2Kk"));

// getAccountInfo(new Solana.PublicKey("AZ2HiSsD7G1gEt9stCV2ZdJprsLUKMTacwkj67YjG52"))

// findAssociatedTokenAddress(walletAddress, mintAddress);

// getTokenLargestAccounts(new Solana.PublicKey("2ZkGVeppRLQuG6GpBLLfsQiwJna9p1jzhpF8Wr3r9MRQ"))

// findMintStatePk(new Solana.PublicKey("49CHrm1Vu9z3tvGGAXAxeBni8f7gwsui2kUHHJrMeipc"))

// MIP1.findRuleSetPDA("AZ2HiSsD7G1gEt9stCV2ZdJprsLUKMTacwkj67YjG52")

// getTransactions(new Solana.PublicKey("HgRrsqDwAJXhPNJrVDy1NrMwF8SHZYCXdsCgzqD43LW"))