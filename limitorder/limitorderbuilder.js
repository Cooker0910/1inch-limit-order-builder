"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LimitOrderBuilder = exports.generateRFQOrderInfo = exports.generateOrderSalt = void 0;
var limit_order_protocol_const_1 = require("./limit-order-protocol.const");
var limit_order_protocol_model_1 = require("./model/limit-order-protocol.model");
var eth_sig_util_1 = require("eth-sig-util");
var erc20_facade_1 = require("./erc20.facade");
function generateOrderSalt() {
    return Math.round(Math.random() * Date.now()) + '';
}
exports.generateOrderSalt = generateOrderSalt;
function generateRFQOrderInfo(id, expiresInTimestamp) {
    return ((BigInt(expiresInTimestamp) << BigInt(64)) | BigInt(id)).toString(10);
}
exports.generateRFQOrderInfo = generateRFQOrderInfo;
var LimitOrderBuilder = /** @class */ (function () {
    function LimitOrderBuilder(contractAddress, chainId, providerConnector, generateSalt) {
        if (generateSalt === void 0) { generateSalt = generateOrderSalt; }
        this.contractAddress = contractAddress;
        this.chainId = chainId;
        this.providerConnector = providerConnector;
        this.generateSalt = generateSalt;
        this.erc20Facade = new erc20_facade_1.Erc20Facade(this.providerConnector);
    }
    LimitOrderBuilder.prototype.buildOrderSignature = function (walletAddress, typedData) {
        var dataHash = eth_sig_util_1.TypedDataUtils.hashStruct(typedData.primaryType, typedData.message, typedData.types, true).toString('hex');
        return this.providerConnector.signTypedData(walletAddress, typedData, dataHash);
    };
    LimitOrderBuilder.prototype.buildLimitOrderHash = function (orderTypedData) {
        var message = orderTypedData;
        return limit_order_protocol_const_1.ZX + eth_sig_util_1.TypedDataUtils.sign(message).toString('hex');
    };
    LimitOrderBuilder.prototype.buildLimitOrderTypedData = function (order) {
        return {
            primaryType: 'Order',
            types: {
                EIP712Domain: limit_order_protocol_const_1.EIP712_DOMAIN,
                Order: limit_order_protocol_const_1.ORDER_STRUCTURE,
            },
            domain: {
                name: limit_order_protocol_const_1.PROTOCOL_NAME,
                version: limit_order_protocol_const_1.PROTOCOL_VERSION,
                chainId: this.chainId,
                verifyingContract: this.contractAddress,
            },
            message: order,
        };
    };
    LimitOrderBuilder.prototype.buildRFQOrderTypedData = function (order) {
        return {
            primaryType: 'OrderRFQ',
            types: {
                EIP712Domain: limit_order_protocol_const_1.EIP712_DOMAIN,
                OrderRFQ: limit_order_protocol_const_1.RFQ_ORDER_STRUCTURE,
            },
            domain: {
                name: limit_order_protocol_const_1.PROTOCOL_NAME,
                version: limit_order_protocol_const_1.PROTOCOL_VERSION,
                chainId: this.chainId,
                verifyingContract: this.contractAddress,
            },
            message: order,
        };
    };
    /* eslint-disable max-lines-per-function */
    LimitOrderBuilder.prototype.buildRFQOrder = function (_a) {
        var id = _a.id, expiresInTimestamp = _a.expiresInTimestamp, makerAssetAddress = _a.makerAssetAddress, takerAssetAddress = _a.takerAssetAddress, makerAddress = _a.makerAddress, _b = _a.takerAddress, takerAddress = _b === void 0 ? limit_order_protocol_const_1.ZERO_ADDRESS : _b, makerAmount = _a.makerAmount, takerAmount = _a.takerAmount;
        return {
            info: generateRFQOrderInfo(id, expiresInTimestamp),
            makerAsset: makerAssetAddress,
            takerAsset: takerAssetAddress,
            makerAssetData: this.erc20Facade.transferFrom(null, makerAddress, takerAddress, makerAmount),
            takerAssetData: this.erc20Facade.transferFrom(null, takerAddress, makerAddress, takerAmount),
        };
    };
    /* eslint-enable max-lines-per-function */
    /* eslint-disable max-lines-per-function */
    LimitOrderBuilder.prototype.buildLimitOrder = function (_a) {
        var makerAssetAddress = _a.makerAssetAddress, takerAssetAddress = _a.takerAssetAddress, makerAddress = _a.makerAddress, _b = _a.takerAddress, takerAddress = _b === void 0 ? limit_order_protocol_const_1.ZERO_ADDRESS : _b, makerAmount = _a.makerAmount, takerAmount = _a.takerAmount, _c = _a.predicate, predicate = _c === void 0 ? limit_order_protocol_const_1.ZX : _c, _d = _a.permit, permit = _d === void 0 ? limit_order_protocol_const_1.ZX : _d, _e = _a.interaction, interaction = _e === void 0 ? limit_order_protocol_const_1.ZX : _e;
        return {
            salt: this.generateSalt(),
            makerAsset: makerAssetAddress,
            takerAsset: takerAssetAddress,
            makerAssetData: this.erc20Facade.transferFrom(null, makerAddress, takerAddress, makerAmount),
            takerAssetData: this.erc20Facade.transferFrom(null, takerAddress, makerAddress, takerAmount),
            getMakerAmount: this.getAmountData(limit_order_protocol_model_1.LimitOrderProtocolMethods.getMakerAmount, makerAmount, takerAmount),
            getTakerAmount: this.getAmountData(limit_order_protocol_model_1.LimitOrderProtocolMethods.getTakerAmount, makerAmount, takerAmount),
            predicate: predicate,
            permit: permit,
            interaction: interaction,
        };
    };
    /* eslint-enable max-lines-per-function */
    // Get nonce from contract (nonce method) and put it to predicate on order creating
    LimitOrderBuilder.prototype.getAmountData = function (methodName, makerAmount, takerAmount, swapTakerAmount) {
        if (swapTakerAmount === void 0) { swapTakerAmount = '0'; }
        return this.getContractCallData(methodName, [
            makerAmount,
            takerAmount,
            swapTakerAmount,
        ]).substr(0, 2 + 68 * 2);
    };
    LimitOrderBuilder.prototype.getContractCallData = function (methodName, methodParams) {
        if (methodParams === void 0) { methodParams = []; }
        return this.providerConnector.contractEncodeABI(limit_order_protocol_const_1.LIMIT_ORDER_PROTOCOL_ABI, this.contractAddress, methodName, methodParams);
    };
    return LimitOrderBuilder;
}());
exports.LimitOrderBuilder = LimitOrderBuilder;
