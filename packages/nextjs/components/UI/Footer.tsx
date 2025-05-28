import Link from "next/link";
import { hardhat } from "viem/chains";
import { CurrencyDollarIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { SwitchTheme } from "~~/components/UI/SwitchTheme";
import { Faucet } from "~~/components/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { useGlobalState } from "~~/services/store/store";

/**
 * Site footer
 */
export const Footer = () => {
  const nativeCurrencyPrice = useGlobalState(state => state.nativeCurrency.price);
  const { targetNetwork } = useTargetNetwork();
  const isLocalNetwork = targetNetwork.id === hardhat.id;

  return (
    <div className="min-h-0 px-1 py-3">
      <div>
        <div className="fixed bottom-0 left-0 z-10 flex items-center justify-between w-full p-4 pointer-events-none">
          <div className="flex flex-col gap-2 pointer-events-auto md:flex-row">
            {nativeCurrencyPrice > 0 && (
              <div>
                <div className="gap-1 font-normal cursor-auto btn btn-primary btn-sm">
                  <CurrencyDollarIcon className="w-4 h-4" />
                  <span>{nativeCurrencyPrice.toFixed(2)}</span>
                </div>
              </div>
            )}
            {isLocalNetwork && (
              <>
                <Faucet />
                <Link href="/blockexplorer" passHref className="gap-1 font-normal btn btn-primary btn-sm">
                  <MagnifyingGlassIcon className="w-4 h-4" />
                  <span>Block Explorer</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="w-full">
        <ul className="w-full pb-2 border-b border-gray-200">
          <div className="flex items-center justify-center w-full gap-2 text-sm">
            <div className="text-center">
              <a href="https://github.com/velikanghost/se2-farcaster" target="_blank" rel="noreferrer" className="link">
                Fork me
              </a>
            </div>
            <span>·</span>
            <div className="text-center">
              <a href="https://t.me/joinchat/KByvmRe5wkR-8F_zz6AjpA" target="_blank" rel="noreferrer" className="link">
                Support
              </a>
            </div>
          </div>
        </ul>
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center justify-center gap-2 px-1">
            <p className="m-0 text-sm text-center">For Farcaster Mini-Apps by</p>
            <a
              className="flex items-center justify-center gap-1"
              href="https://x.com/velkan_gst"
              target="_blank"
              rel="noreferrer"
            >
              <span className="text-sm link">Velikan</span>
            </a>
          </div>
          <SwitchTheme className={`pointer-events-auto ${isLocalNetwork ? "self-end md:self-auto" : ""}`} />
        </div>
      </div>
    </div>
  );
};
