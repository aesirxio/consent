/*
 * @copyright   Copyright (C) 2022 AesirX. All rights reserved.
 * @license     GNU General Public License version 3, see LICENSE.
 */

import React, { Dispatch, ReactNode, SetStateAction, useEffect, useRef, useState } from 'react';
import { appLanguages } from '../translations';
import { AesirXI18nextProvider } from './I18nextProvider';

interface Props {
  children?: ReactNode;
}

interface ConsentContextType {
  visitor_uuid: string;
  setUUID: Dispatch<SetStateAction<string>>;
  ref: any;
}

export const ConsentContext = React.createContext<ConsentContextType>({
  visitor_uuid: undefined,
  setUUID: undefined,
  ref: undefined,
});

const ConsentContextProvider: React.FC<Props> = ({ children }) => {
  const [UUID, setUUID] = useState();
  const ref = useRef();

  useEffect(() => {
    const uuid: any = sessionStorage.getItem('aesirx-analytics-uuid');
    uuid && setUUID(uuid);
  }, []);

  return (
    <ConsentContext.Provider
      value={{
        visitor_uuid: UUID,
        setUUID: setUUID,
        ref: ref,
      }}
    >
      <AesirXI18nextProvider appLanguages={appLanguages}>{children}</AesirXI18nextProvider>
    </ConsentContext.Provider>
  );
};

export default ConsentContextProvider;
