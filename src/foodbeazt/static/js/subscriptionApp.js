var subscriptionApp = angular.module('subscriptionApp',['ngRoute', 'ngCookies','ngMessages'])

function validateEmail(email) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

subscriptionApp.controller('subscribeWithEmail', function($scope,$http){
	$scope.email = ''
	$scope.error_msg = ''
	$scope.success_msg = ''

	$scope.subscribe = function() {
	    $scope.error_msg = ''
    	$scope.success_msg = ''
	    var email = $scope.email

		if(!email || email.length == 0 || !validateEmail(email)) {
		    $scope.error_msg = 'Please enter a valid email!'
		}else{
		    $http.post('/api/subscribe/'+email).success(function(){
		        $scope.success_msg = 'Thank you! You have been subscribed successfully!'
		    }).error(function(data, status){
                if(data && data.status == "error" && data.message){
                    $scope.error_msg = data.message
                }else{
                    $scope.error_msg = 'Oops! Got some error while trying to subscribe you. Kindly try again later!'
                }
		    })
		}
	}
})