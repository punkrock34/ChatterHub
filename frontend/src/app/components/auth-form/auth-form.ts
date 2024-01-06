// auth-form.component.ts
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { AuthService } from '../../services/auth/auth.service';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-auth-form',
  templateUrl: './auth-form.html',
  styleUrls: ['./auth-form.css']
})
export class AuthFormComponent implements OnInit {
  authForm: FormGroup = new FormGroup({});

  // Font Awesome icons
  faEye = faEye;
  faEyeSlash = faEyeSlash;

  // Hide or show password
  showPassword = false;

  constructor(public authService: AuthService) { }

  ngOnInit(): void {
    // Initialize the form
    this.initForm();
  }

  // Initialize the form
  initForm(): void {
    this.authForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required, this.passwordValidator()])
    });
  }

  // Custom validator for password
  passwordValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value: string = control.value;

      if (!value) {
        return { required: true };
      }

      if (value.length < 8) {
        return { minlength: true };
      }

      // Add your custom password pattern validation logic here
      // For example, using a regular expression
      const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,30}$/;

      if (!passwordPattern.test(value)) {
        return { pattern: true };
      }

      return null; // Password is valid
    };
  }
}
