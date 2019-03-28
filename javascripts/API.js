
var API = {};
var user_training_module_relation;
API.LMSInitialize = function(){
    return true;
}

API.LMSFinish = function() {
        return true;
};

API.LMSGetValue =  function(parameter) {
    var result = 0;
    $.ajax({
        url: 'http://localhost:3000/lms/getParameter/',
        data: {
            "param": parameter,
            "relation": user_training_module_relation
        },
        error: function(e){
            console.log('Error', e);
        },
        success: function(data) {
            // console.log(data.value);
            result = data.value;
        },
        type: 'GET',
        async: false
    });

    return result;
};

API.LMSSetValue = function(element, value) {
    var result = false;
    // console.log(element, value);
    $.ajax({
        type: "POST",
        url: "http://localhost:3000/lms/setParameterValue/",
        data: {
           "param": element,
           "value": value,
           "relation": user_training_module_relation
        },
        success: function(data) {
            // console.log("data setParameterValue is ", data);
            result = data.status
        },
        error: function(e){
            console.log('Error', e);
        },
        dataType: 'json',
        async: false
    });
    return result;

};

API.LMSCommit = function() {
        return true;
};
API.LMSGetLastError = function() {
        return 0;
    };

API.LMSGetErrorString = function() {
        return;
    }

API.LMSGetDiagnostic = function() {
        return 'Specific error';
};



