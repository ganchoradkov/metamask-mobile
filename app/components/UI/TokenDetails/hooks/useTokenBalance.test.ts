import { renderHookWithProvider } from '../../../../util/test/renderWithProvider';
import { useTokenBalance } from './useTokenBalance';
import { TokenI } from '../../Tokens/types';
import {
  selectAsset,
  selectTronSpecialAssetsBySelectedAccountGroup,
  TronSpecialAssetsMap,
} from '../../../../selectors/assets/assets-list';
import { createStakedTrxAsset } from '../../AssetOverview/utils/createStakedTrxAsset';
import { createReadyForWithdrawalTrxAsset } from '../../AssetOverview/utils/createTronDerivedAsset';

const createEmptySpecialAssetsMap = (): TronSpecialAssetsMap => ({
  energy: undefined,
  bandwidth: undefined,
  maxEnergy: undefined,
  maxBandwidth: undefined,
  stakedTrxForEnergy: undefined,
  stakedTrxForBandwidth: undefined,
  totalStakedTrx: 0,
  trxReadyForWithdrawal: undefined,
  trxStakingRewards: undefined,
  trxInLockPeriod: undefined,
});

jest.mock('../../../../selectors/assets/assets-list', () => ({
  selectAsset: jest.fn(),
  selectTronSpecialAssetsBySelectedAccountGroup: jest.fn(
    (): TronSpecialAssetsMap => ({
      energy: undefined,
      bandwidth: undefined,
      maxEnergy: undefined,
      maxBandwidth: undefined,
      stakedTrxForEnergy: undefined,
      stakedTrxForBandwidth: undefined,
      totalStakedTrx: 0,
      trxReadyForWithdrawal: undefined,
      trxStakingRewards: undefined,
      trxInLockPeriod: undefined,
    }),
  ),
}));

jest.mock('../../AssetOverview/utils/createStakedTrxAsset', () => ({
  createStakedTrxAsset: jest.fn(),
}));

jest.mock('../../AssetOverview/utils/createTronDerivedAsset', () => ({
  createReadyForWithdrawalTrxAsset: jest.fn(),
}));

const mockSelectAsset = jest.mocked(selectAsset);
const mockSelectTronResources = jest.mocked(
  selectTronSpecialAssetsBySelectedAccountGroup,
);
const mockCreateStakedTrxAsset = jest.mocked(createStakedTrxAsset);
const mockCreateReadyForWithdrawalTrxAsset = jest.mocked(
  createReadyForWithdrawalTrxAsset,
);

describe('useTokenBalance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSelectTronResources.mockReturnValue(createEmptySpecialAssetsMap());
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('returns balances from processed asset', () => {
    const token = {
      address: '0x6b175474e89094c44da98b954eedeac495271d0f',
      chainId: '0x1',
      isStaked: false,
    } as TokenI;

    mockSelectAsset.mockReturnValue({
      balance: '100',
      balanceFiat: '$100.00',
      symbol: 'DAI',
    } as TokenI);

    const { result } = renderHookWithProvider(() => useTokenBalance(token));

    // Address is normalized to checksum format for consistent lookup
    expect(mockSelectAsset).toHaveBeenCalledWith(expect.any(Object), {
      address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      chainId: token.chainId,
      isStaked: false,
    });
    expect(result.current.balance).toBe('100');
    expect(result.current.fiatBalance).toBe('$100.00');
    expect(result.current.tokenFormattedBalance).toBe('100 DAI');
  });

  it('passes through isStaked when token is staked', () => {
    const token = {
      address: '0x0000000000000000000000000000000000000000',
      chainId: '0x1',
      isStaked: true,
    } as TokenI;

    mockSelectAsset.mockReturnValue({
      balance: '2',
      balanceFiat: '$4,800.00',
      symbol: 'ETH',
      isStaked: true,
    } as TokenI);

    renderHookWithProvider(() => useTokenBalance(token));

    expect(mockSelectAsset).toHaveBeenCalledWith(expect.any(Object), {
      address: token.address,
      chainId: token.chainId,
      isStaked: true,
    });
  });

  it('returns staked TRX asset for Tron native token', () => {
    const tronToken = {
      address: '',
      chainId: 'tron:0x2b6653dc',
      ticker: 'TRX',
      symbol: 'TRX',
    } as TokenI;

    const mockStakedAsset = { symbol: 'sTRX', balance: '50' } as TokenI;

    mockSelectAsset.mockReturnValue({
      balance: '1000',
      balanceFiat: '$100.00',
      symbol: 'TRX',
    } as TokenI);

    mockSelectTronResources.mockReturnValue({
      ...createEmptySpecialAssetsMap(),
      stakedTrxForEnergy: { symbol: 'strx-energy', balance: '100' },
      stakedTrxForBandwidth: { symbol: 'strx-bandwidth', balance: '200' },
    } as TronSpecialAssetsMap);

    mockCreateStakedTrxAsset.mockReturnValue(mockStakedAsset);

    const { result } = renderHookWithProvider(() => useTokenBalance(tronToken));

    expect(mockSelectAsset).toHaveBeenCalledWith(expect.any(Object), {
      address: tronToken.address,
      chainId: tronToken.chainId,
      isStaked: false,
    });
    expect(result.current.balance).toBe('1000');
    expect(result.current.fiatBalance).toBe('$100.00');
    expect(result.current.tokenFormattedBalance).toBe('1000 TRX');
    expect(result.current.isTronNative).toBe(true);
    expect(result.current.stakedTrxAsset).toBe(mockStakedAsset);
    expect(mockCreateStakedTrxAsset).toHaveBeenCalledWith(
      tronToken,
      '100',
      '200',
    );
  });

  it('returns ready-for-withdrawal asset for Tron native token', () => {
    const tronToken = {
      address: '',
      chainId: 'tron:0x2b6653dc',
      ticker: 'TRX',
      symbol: 'TRX',
    } as TokenI;

    const mockRfwAsset = { symbol: 'rfwTRX', balance: '10' } as TokenI;

    mockSelectAsset.mockReturnValue({
      balance: '1000',
      balanceFiat: '$100.00',
      symbol: 'TRX',
    } as TokenI);

    mockSelectTronResources.mockReturnValue({
      ...createEmptySpecialAssetsMap(),
      trxReadyForWithdrawal: {
        symbol: 'trx-ready-for-withdrawal',
        balance: '10',
      },
    } as unknown as TronSpecialAssetsMap);

    mockCreateReadyForWithdrawalTrxAsset.mockReturnValue(mockRfwAsset);

    const { result } = renderHookWithProvider(() => useTokenBalance(tronToken));

    expect(result.current.readyForWithdrawalTrxAsset).toBe(mockRfwAsset);
    expect(mockCreateReadyForWithdrawalTrxAsset).toHaveBeenCalledWith(
      tronToken,
      '10',
    );
  });

  it('returns undefined for ready-for-withdrawal when resources are not available', () => {
    const tronToken = {
      address: '',
      chainId: 'tron:0x2b6653dc',
      ticker: 'TRX',
      symbol: 'TRX',
    } as TokenI;

    mockSelectAsset.mockReturnValue({
      balance: '1000',
      balanceFiat: '$100.00',
      symbol: 'TRX',
    } as TokenI);

    mockSelectTronResources.mockReturnValue(createEmptySpecialAssetsMap());

    const { result } = renderHookWithProvider(() => useTokenBalance(tronToken));

    expect(result.current.readyForWithdrawalTrxAsset).toBeUndefined();
    expect(mockCreateReadyForWithdrawalTrxAsset).not.toHaveBeenCalled();
  });
});
