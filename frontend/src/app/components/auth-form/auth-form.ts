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

  // Show or hide spinner
  showSpinner = false;

  constructor(public authService: AuthService) { }

  ngOnInit(): void {
    this.initForm();
  }

  // Initialize the form
  private initForm(): void {
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

      // Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character
      const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,}$/;

      if (!passwordPattern.test(value)) {
        return { pattern: true };
      }

      return null; // Password is valid
    };
  }

  onSubmit(): void {
    this.showSpinner = true;
    this.authService.loginOrRegister(this.authForm).finally(() => {
      this.showSpinner = false;
    });
  }
}
