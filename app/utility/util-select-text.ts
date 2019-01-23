export function registerSelectText(app: ng.IModule)
{
	app.directive("utilSelectText", [() =>
		({
			restrict: 'A',
			link: (scope, element: JQLite, attr) =>
			{
				scope.$watch(attr["utilSelectText"], (newValue: string, _oldValue) =>
				{
					if (newValue == null)
						return;
	
					var input = <HTMLTextAreaElement | HTMLInputElement>element[0];
					var index = input.value.indexOf(newValue);
					if (index == -1)
						return;
	
					input.selectionStart = index;
					input.selectionEnd = index + newValue.length;
				})
			}
		})]);
}