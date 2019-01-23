export function registerModelTypeInt(app: ng.IModule)
{
    app.directive('utilModelTypeInt', () =>
        ({
            require: 'ngModel',
            link: (_scope, _ele, _attr, ctrl: ng.INgModelController | undefined) =>
            {
                if (ctrl == null) return;

                ctrl.$formatters.unshift(modelValue => modelValue == null ? null : modelValue.toString());
                ctrl.$parsers.unshift(viewValue => parseInt(viewValue, 10));
            }
        })
    );
}