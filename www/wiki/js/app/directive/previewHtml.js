/**
 * Created by wuxiangan on 2016/12/20.
 */
define(['app'], function (app) {
    app.directive('previewHtml', ['$compile', function ($compile) {
			return function(scope, element, attrs) {
				scope.$watch(function($scope){
					return $scope.$eval(attrs.wikiHtml);
				}, function(value){
					element.html(value);

					$compile(element.contents())(scope);
				});
			}
    }]);
});
