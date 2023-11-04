import * as process from "process";
import {Record} from "@/types";

export function useClient() {
  const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL;

  const getAddress = async (name: string) => {
    if (!name.endsWith(".ans")) {
      name = `${name}.ans`;
    }
    return new Promise<string>((resolve, reject) => {
      fetch(`${NEXT_PUBLIC_API_URL}/address/${name}`)
        .then((response) => response.json())
        .then((data) => {
          resolve(data.address);
        })
        .catch((error) => {
          reject({message: `${name} has not been registered`});
        });
    });
  }

  const getNameHash = async (name: string) => {
    return new Promise<string>((resolve, reject) => {
      fetch(`${NEXT_PUBLIC_API_URL}/name_to_hash/${name}.ans`)
        .then((response) => response.json())
        .then((data) => {
          resolve(data.name_hash);
        })
        .catch((error) => {
          resolve("");
        });
    });
  }

  const getName = async (hashName: string) => {
    return new Promise<string>((resolve, reject) => {
      fetch(`${NEXT_PUBLIC_API_URL}/hash_to_name/${hashName}`)
        .then((response) => response.json())
        .then((data) => {
          resolve(data.name);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  const getPrimaryName = async (publicKey: string) => {
    return new Promise<string>((resolve, reject) => {
      if (publicKey) {
        fetch(`${NEXT_PUBLIC_API_URL}/primary_name/${publicKey}`)
          .then((response) => response.json())
          .then((data) => {
            resolve(data.name);
          })
          .catch((error) => {
            resolve("");
          });
      } else {
        resolve("");
      }
    });
  }

  const getSubNames = async (name: string) => {
    return new Promise<Array<Record>>((resolve, reject) => {
      fetch(`${NEXT_PUBLIC_API_URL}/subdomain/${name}`)
        .then((response) => response.json())
        .then((data: Array<{name: string, address: string, name_hash: string}>) => {
          resolve(data.map(item => {
            return {
              name: item.name,
              private: item.address == "",
              isPrimaryName: false,
              nameHash: item.name_hash
            } as Record;
          }));
        })
        .catch((error) => {
          resolve([]);
        });
    });
  }

  return {getAddress, getNameHash, getPrimaryName, getName, getSubNames};
}