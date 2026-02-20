export class APiProperties {   

    clientId : any;
    clientSecret : any;
    
    webCompanyName : any;
    webClientID : any;
    webClientSecret : any;

    owVendorClientId : any;
    owVendorClientSecret : any;

    perClientId : any;
    perClientSecret : any;

    //Partner Enroll Api
    peaClientId : any;
    peaClientSecret : any;

    cmClientId : any;
    cmClientSecret : any;

    nodejsOnewayAdminUrl : any;
    mongolocationUrl : any;
    webApiURL : any;
    partnerEnrollApi : any;
    logApi : any;
    partnerbookingApi : any;
    expressDispatchApi : any;
    restWebUrl : any;
    onewayPartnerApi : any;
    onewayVendorApi : any;
    onewayRedisRestUrl : any;
    onewayPartnerenrollrest : any;

    communicationMasterApi : any;
    partnerweb : any;

    bookingStatusChangeUrl : any;

    logManageApi: any;
    driApiV3: any;

    onewayRedisRest: any;
    onewaySchoolVanRestApi: any;
    onewaySchoolVanApi: any;

    clientIdPartnerenrolapi: any;
    clientSecretPartnerenrolapi: any;

    onewayLocationWebSocketApi: any;
    
    pySmartChatUrl : any;
    pySmartChatUrlForChat : any;
    pySmartChatV2AuthUrl : any;
    pySmartChatV2RateUrl : any;

    constructor() {
        //if((window.location.hostname == 'localhost') || (window.location.hostname == 'stagingoperations.onewaycab.company')){
        //if(window.location.hostname == 'stagingoperation.oneway.cab'){                    
        if(window.location.hostname == 'localhost'){
            this.clientId = 'mobapp';
            this.clientSecret = 'mobappsecret';

            this.webCompanyName = 'WEB';
            this.webClientID = 'mobapp';
            this.webClientSecret = 'mobappsecret';

            this.owVendorClientId = 'mobapp';
            this.owVendorClientSecret = 'mobappsecret';

            this.perClientId = 'mobapp';
            this.perClientSecret = 'mobappsecret';

            //Partner Enroll Api
            this.peaClientId = 'mobapp';
            this.peaClientSecret = 'mobappsecret';

            this.cmClientId = 'mobapp';
            this.cmClientSecret = 'mobappsecret';

            this.clientIdPartnerenrolapi = 'mobapp';
            this.clientSecretPartnerenrolapi = 'mobappsecret';

            this.nodejsOnewayAdminUrl = 'https://stagingnode.oneway.cab/';
            this.mongolocationUrl = 'https://stagingmongolocationapp.oneway.cab/';
            this.mongolocationUrl = 'https://mongolocationapp.oneway.cab/';
            this.webApiURL = 'https://stagingwebapi.oneway.cab/third/';
            this.partnerEnrollApi = 'https://stagingpartnerenrolapi.oneway.cab/rest/V1/';
            this.logApi = 'https://staginglogmanage.oneway.cab/rest/V1/';
            this.partnerbookingApi = 'https://stagingpartnerbookingaccept.oneway.cab/rest/V21/';
            this.expressDispatchApi = 'https://stagingexpress.oneway.cab/rest/V21/';
            this.restWebUrl = 'https://stagingpartnerenrollrest.oneway.cab/';
            this.onewayPartnerApi = 'https://stagingpartnerapi.oneway.cab/rest/V21/';
            this.onewayVendorApi = 'https://stagingvendor.oneway.cab/rest/';
            this.onewayRedisRestUrl = 'https://stagingredisrest.oneway.cab/rest/V1/';
            this.onewayPartnerenrollrest = 'https://stagingpartnerenrollrest.oneway.cab/rest/V1/';
            this.communicationMasterApi = 'https://stagingcommunicationmaster.oneway.cab/rest/V1/';
            this.partnerweb = 'https://stagingpartnerweb.oneway.cab/rest/V1/';
            this.bookingStatusChangeUrl = 'https://stagingpartnerstatus.oneway.cab/rest/V21/';
            this.logManageApi = 'https://staginglogmanage.oneway.cab/rest/V1/';
            this.driApiV3 = 'https://stagingdriapi.oneway.cab/v3/';
            this.onewayRedisRest = "https://stagingredisrest.oneway.cab/rest/V1/";
            //this.onewaySchoolVanRestApi = "https://restschoolvan.oneway.cab/actuator/";
            this.onewaySchoolVanRestApi = "https://stagingrestschoolvan.oneway.cab/rest/V1/";
            this.onewaySchoolVanApi = "https://stagingrestschoolvan.oneway.cab/api/V1/";
            
            this.onewayLocationWebSocketApi = 'wss://staginglocationsocket.oneway.cab/';

            this.pySmartChatUrl = "https://restchatsupport.oneway.cab/";
            this.pySmartChatUrlForChat = "https://restchatsupport.oneway.cab";
            this.pySmartChatV2AuthUrl = "https://restchatsupport.oneway.cab/api/auth/login";
            this.pySmartChatV2RateUrl = "https://restchatsupport.oneway.cab/api/chats";
        } else {
            this.clientId = 'LiveRH8FeT7Atz';
            this.clientSecret = 'LivejtefdfgvNYb56qAH';

            this.webCompanyName = 'Web';
            this.webClientID = 'webapp';
            this.webClientSecret = 'XTdI790c598u21C';

            this.owVendorClientId = 'LiveRH8FeT7Atz';
            this.owVendorClientSecret = 'LivejtefdfgvNYb56qAH';

            this.perClientId = 'livewebpp';
            this.perClientSecret = 'livewebappsecret';

            //Partner Enroll Api
            this.peaClientId = 'mobapp';
            this.peaClientSecret = 'mobappsecret';

            this.cmClientId = 'webapp';
            this.cmClientSecret = 'XTdI790c598u21C';

            this.clientIdPartnerenrolapi = 'LiveRH8FeT7Atz';
            this.clientSecretPartnerenrolapi = 'LivejtefdfgvNYb56qAH';

            this.nodejsOnewayAdminUrl = 'https://node.oneway.cab/';
            this.mongolocationUrl = 'https://mongolocationapp.oneway.cab/';
            this.webApiURL = 'https://webapi.oneway.cab/third/';
            this.partnerEnrollApi = 'https://partnerenrolapi.oneway.cab/rest/V1/';
            this.logApi = 'https://logmanage.oneway.cab/rest/V1/';
            this.partnerbookingApi = 'https://partnerbookingaccept.oneway.cab/rest/V21/';
            this.expressDispatchApi = 'https://expressdispatch.oneway.cab/rest/V21/';
            this.restWebUrl = 'https://partnerenrollrest.oneway.cab/';
            this.onewayPartnerApi = 'https://partnerapi2.oneway.cab/rest/V21/';
            this.onewayVendorApi = 'https://vendor.oneway.cab/rest/';
            this.onewayRedisRestUrl = 'https://redisrest.oneway.cab/rest/V1/';
            this.onewayPartnerenrollrest = 'https://partnerenrollrest.oneway.cab/rest/V1/';
            this.communicationMasterApi = 'https://communicationmaster.oneway.cab/rest/V1/';
            this.partnerweb = 'https://partnerweb.oneway.cab/rest/V1/';
            this.bookingStatusChangeUrl = 'https://partnerstatus.oneway.cab/rest/V21/';
            this.logManageApi = 'https://logmanage.oneway.cab/rest/V1/';
            this.driApiV3 = 'https://driapi.oneway.cab/v3/';
            this.onewayRedisRest = "https://redisrest.oneway.cab/rest/V1/";
            //this.onewaySchoolVanRestApi = "https://restschoolvan.oneway.cab/actuator/";
            this.onewaySchoolVanRestApi = "https://restschoolvan.oneway.cab/rest/V1/";
            this.onewaySchoolVanApi = "https://restschoolvan.oneway.cab/api/V1/";

            this.onewayLocationWebSocketApi = 'wss://locationsocket.oneway.cab/';

            this.pySmartChatUrl = "https://restchatsupport.oneway.cab/";
            this.pySmartChatUrlForChat = "https://restchatsupport.oneway.cab";
            this.pySmartChatV2AuthUrl = "https://restchatsupport.oneway.cab/api/auth/login";
            this.pySmartChatV2RateUrl = "https://restchatsupport.oneway.cab/api/chats";
        }

    }
    
}