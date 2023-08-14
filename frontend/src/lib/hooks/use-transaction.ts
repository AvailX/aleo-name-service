import {useEffect, useState} from "react";
import {Record, StatusChangeCallback} from "@/types";
import {LeoWalletAdapter} from "@demox-labs/aleo-wallet-adapter-leo";
import {useWallet} from "@demox-labs/aleo-wallet-adapter-react";
import {useRecords} from "@/lib/hooks/use-records";
import {useClient} from "@/lib/hooks/use-client";

interface AnsTransaction {
  method: string;
  id: string;
  params: any[];
  onStatusChange?: StatusChangeCallback;
}


export function useTransaction() {
  const {refreshRecords, replaceRecord, removeRecord, syncPrimaryName} = useRecords();
  const {getNameHash} = useClient();
  const {wallet, publicKey, requestRecords} = useWallet();
  const [transactions, setTransactions] = useState<AnsTransaction[]>([]);

  const getTransactionStatus = async (tx: AnsTransaction) => {
    const status = await (
      wallet?.adapter as LeoWalletAdapter
    ).transactionStatus(tx.id);
    tx.onStatusChange && tx.onStatusChange(true, {hasError: false, message: status});
    console.log(tx.id, status);
    if (status === "Failed") {
      setTransactions(transactions.filter((t) => t.id !== tx.id));
      tx.onStatusChange && tx.onStatusChange(false, {hasError: true, message: status});
    } else if (status === "Finalized") {
      setTransactions(transactions.filter((t) => t.id !== tx.id));

      switch (tx.method) {
        case "transfer":
          removeRecord(tx.params[0]);
          break;
        case "convertToPublic":
          getNameHash(tx.params[0])
            .then((name_hash) => {
              const record = {
                name: tx.params[0],
                private: false,
                name_hash: name_hash,
              } as Record;
              replaceRecord(record);
            });
          break;
        case "register":
        case "convertToPrivate":
          await refreshRecords("manual");
          break;
        case "setPrimaryName":
        case "unsetPrimaryName":
          syncPrimaryName();
          break;
      }

      tx.onStatusChange && tx.onStatusChange(false, {hasError: false, message: status});
    }
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;

    // Clear the previous timer at the start of the effect
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = undefined;
    }

    // Only set a new timer if there are transactions
    if (transactions.length > 0) {
      intervalId = setInterval(() => {
        transactions.forEach((tx) => {
          getTransactionStatus(tx);
        });
      }, 1000);
    }

    // Clear the timer when the component unmounts
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [transactions]);

  const addTransaction = (method: string, id: string, params: any[], onStatusChange?: StatusChangeCallback) => {
    setTransactions([...transactions, {method, id, params, onStatusChange}]);
  }

  return {addTransaction}
}