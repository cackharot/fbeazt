var settingsApp = angular.module('fbeaztAdmin')

settingsApp.controller('settingsController', function ($scope, $http) {
    $scope.model = {
        'delivery_disabled': false,
        'delivery_hours': '',
        'disable_app_versions': '',
        'delivery_disabled_reason': '',
        'adv_text': '',
        'adv_image_url': ''
    }
    $scope.error_msg = ''
    $scope.success_msg = ''
    $scope.load = function () {
        $http.get('/api/settings').success(function (data) {
            if (data == null) {
                data = $scope.model
            }
            if (data.disable_app_versions && data.disable_app_versions instanceof Array) {
                data.disable_app_versions = data.disable_app_versions.join(",")
            }
            $scope.model = data;
        }).error(function (data) {
            if (data && data.status == "error" && data.message) {
                $scope.error_msg = data.message
            } else {
                $scope.error_msg = 'Oops! Got some error while trying to fetch settings!'
            }
        })
    }

    $scope.save = function () {
        $scope.error_msg = ''
        $scope.success_msg = ''
        var item = angular.copy($scope.model)
        item.disable_app_versions = item.disable_app_versions.split(',')
        $http.post('/api/settings', item).success(function () {
            $scope.success_msg = 'Settings saved successfully!'
            $scope.load()
        }).error(function (data, status) {
            if (data && data.status == "error" && data.message) {
                $scope.error_msg = data.message
            } else {
                $scope.error_msg = 'Oops! Got some error while trying to save settings!'
            }
        })
    }

    $scope.load()
})
