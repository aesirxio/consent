/*
 * @copyright   Copyright (C) 2022 AesirX. All rights reserved.
 * @license     GNU General Public License version 3, see LICENSE.
 */

import React, { ReactNode, useEffect, useReducer, useRef, useState } from 'react';
import { ConsentContext } from './ConsentContextProvider';

interface Props {
  children?: ReactNode;
}

const ConsentContextProviderIsolate: React.FC<Props> = ({ children }) => {
  const [UUID, setUUID] = useState();
  const ref = useRef();
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

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
        forceUpdate: forceUpdate,
      }}
    >
      {children}
    </ConsentContext.Provider>
  );
};

export default ConsentContextProviderIsolate;
